from flask import Flask, request, render_template, jsonify
import pandas as pd
import yfinance as yf
import os
from datetime import datetime, timedelta
import ta
import numpy as np
import warnings
warnings.filterwarnings('ignore')

application = Flask(__name__)
app = application

# Model will be loaded lazily on first use
MODEL_PATH = 'artifacts/stock_lstm_model.h5'
model = None
model_loading_attempted = False

def load_lstm_model():
    """Load the pre-trained LSTM model (lazy loading)"""
    global model, model_loading_attempted
    
    if model_loading_attempted:
        return model
        
    model_loading_attempted = True
    
    try:
        if os.path.exists(MODEL_PATH):
            print(f"📦 Loading TensorFlow model from {MODEL_PATH}...")
            # Import TensorFlow only when needed
            from tensorflow.keras.models import load_model
            model = load_model(MODEL_PATH)
            print(f"✓ Model loaded successfully from {MODEL_PATH}")
        else:
            print(f"⚠ Model file not found at {MODEL_PATH}")
            print(f"   Current directory: {os.getcwd()}")
            print(f"   Files in artifacts/: {os.listdir('artifacts/') if os.path.exists('artifacts/') else 'Directory not found'}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
    
    return model

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/stock_data/<ticker>')
def get_stock_data(ticker):
    """Get comprehensive stock data with prediction and profit/loss analysis"""
    days = request.args.get('days', default=1, type=int)
    days = max(1, min(days, 7))  # Limit between 1-7 days
    
    try:
        ticker = ticker.upper()
        
        # Fetch live stock data using Ticker object (more reliable)
        stock = yf.Ticker(ticker)
        
        # Try to get historical data
        hist = stock.history(period='60d')
        
        # If that fails, try download method
        if hist.empty:
            hist = yf.download(ticker, period='60d', interval='1d', auto_adjust=False, progress=False)
            if isinstance(hist.columns, pd.MultiIndex):
                hist.columns = hist.columns.droplevel(1)
        
        if hist.empty or len(hist) < 2:
            return jsonify({
                'success': False,
                'error': f'No data found for {ticker}. Please check the ticker symbol.'
            }), 404
        
        # Ensure we have Close column
        if 'Close' not in hist.columns:
            return jsonify({
                'success': False,
                'error': f'Invalid data structure for {ticker}. Columns: {list(hist.columns)}'
            }), 500
        
        # Current price
        current_price = float(hist['Close'].iloc[-1])
        previous_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
        
        print(f"✓ Fetched {ticker}: Current=${current_price:.2f}, Predicting {days} days")
        
        # Calculate technical indicators
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        hist['RSI'] = ta.momentum.RSIIndicator(hist['Close']).rsi()
        hist['MACD'] = ta.trend.MACD(hist['Close']).macd()
        hist = hist.dropna()
        
        if hist.empty or len(hist) < 5:
            return jsonify({
                'success': False,
                'error': f'Insufficient data for technical analysis for {ticker}'
            }), 500
        
        # Predict multiple days using LSTM model
        predictions = predict_multi_day_lstm(hist, current_price, days)
        
        # Calculate profit/loss for each day
        prediction_details = []
        today = datetime.now()
        
        for i, pred_price in enumerate(predictions):
            day_num = i + 1
            future_date = today + timedelta(days=day_num)
            profit_loss = pred_price - current_price
            profit_loss_percent = (profit_loss / current_price) * 100
            
            prediction_details.append({
                'day': day_num,
                'date': future_date.strftime('%Y-%m-%d'),
                'day_name': future_date.strftime('%A'),
                'price': float(round(pred_price, 2)),
                'profit_loss': float(round(profit_loss, 2)),
                'profit_loss_percent': float(round(profit_loss_percent, 2)),
                'is_profit': bool(profit_loss > 0)
            })
        
        # First day prediction (tomorrow)
        predicted_price = predictions[0]
        profit_loss = predicted_price - current_price
        profit_loss_percent = (profit_loss / current_price) * 100
        is_profit = profit_loss > 0
        
        # Get historical data for chart (last 30 days)
        chart_dates = [date.strftime('%Y-%m-%d') for date in hist.index[-30:]]
        chart_prices = hist['Close'].tail(30).tolist()
        
        # Future prediction dates
        future_dates = [(today + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(days)]
        future_prices = [float(round(p, 2)) for p in predictions]
        
        # Add predicted price for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Get intraday data for live chart (today)
        try:
            # Use Ticker object method for intraday data
            intraday = stock.history(period='1d', interval='5m')
            
            # If empty, try download method
            if intraday.empty:
                intraday = yf.download(ticker, period='1d', interval='5m', auto_adjust=False, progress=False)
                if isinstance(intraday.columns, pd.MultiIndex):
                    intraday.columns = intraday.columns.droplevel(1)
            
            if not intraday.empty and len(intraday) > 0:
                intraday_times = [t.strftime('%H:%M') for t in intraday.index]
                intraday_prices = intraday['Close'].tolist()
            else:
                # Use last 10 points from daily data as fallback
                intraday_times = [d.strftime('%m/%d') for d in hist.index[-10:]]
                intraday_prices = hist['Close'].tail(10).tolist()
        except Exception as e:
            print(f"Intraday data error: {e}")
            # Fallback to daily data
            intraday_times = [d.strftime('%m/%d') for d in hist.index[-10:]]
            intraday_prices = hist['Close'].tail(10).tolist()
        
        # Stock info with error handling
        try:
            info = stock.info
            company_name = info.get('longName', info.get('shortName', ticker))
            market_cap = info.get('marketCap', 'N/A')
            pe_ratio = info.get('trailingPE', info.get('forwardPE', 'N/A'))
        except Exception as e:
            print(f"Info fetch error: {e}")
            company_name = ticker
            market_cap = 'N/A'
            pe_ratio = 'N/A'
        
        volume = int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0
        
        # Day change
        day_change = current_price - previous_close
        day_change_percent = (day_change / previous_close) * 100
        
        response = {
            'success': True,
            'ticker': str(ticker),
            'company_name': str(company_name),
            'current_price': float(round(current_price, 2)),
            'predicted_price': float(round(predicted_price, 2)),
            'profit_loss': float(round(profit_loss, 2)),
            'profit_loss_percent': float(round(profit_loss_percent, 2)),
            'is_profit': bool(is_profit),
            'day_change': float(round(day_change, 2)),
            'day_change_percent': float(round(day_change_percent, 2)),
            'volume': int(volume),
            'market_cap': str(market_cap) if market_cap == 'N/A' else int(market_cap),
            'pe_ratio': float(round(pe_ratio, 2)) if isinstance(pe_ratio, (int, float)) else str(pe_ratio),
            'days_predicted': int(days),
            'predictions': prediction_details,
            'chart_data': {
                'dates': [str(d) for d in chart_dates],
                'prices': [float(round(p, 2)) for p in chart_prices],
                'future_dates': [str(d) for d in future_dates],
                'future_prices': future_prices,
                'predicted_date': str(tomorrow),
                'predicted_price': float(round(predicted_price, 2))
            },
            'intraday_data': {
                'times': [str(t) for t in intraday_times],
                'prices': [float(round(p, 2)) for p in intraday_prices]
            },
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR fetching {ticker}: {str(e)}")
        print(error_details)
        return jsonify({
            'success': False,
            'error': f'Error fetching data for {ticker}: {str(e)}'
        }), 500

def predict_multi_day_lstm(hist, current_price, days):
    """Predict multiple days ahead using LSTM model"""
    predictions = []
    
    try:
        # Load model if not already loaded
        current_model = load_lstm_model()
        
        if current_model is None:
            # Fallback: Use technical analysis for each day
            for day in range(days):
                pred = predict_with_technical_analysis(hist, current_price)
                predictions.append(pred)
                current_price = pred  # Use prediction as next base
            return predictions
        
        # Import sklearn when needed
        from sklearn.preprocessing import MinMaxScaler
        
        # Prepare data for LSTM
        close_prices = hist['Close'].values.reshape(-1, 1)
        
        # Scale data
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(close_prices)
        
        # Use last 60 days for prediction
        sequence_length = 60
        if len(scaled_data) < sequence_length:
            sequence_length = len(scaled_data)
        
        last_sequence = list(scaled_data[-sequence_length:])
        
        # Predict multiple days iteratively
        for day in range(days):
            # Prepare input sequence
            input_seq = np.array(last_sequence[-sequence_length:]).reshape(1, sequence_length, 1)
            
            # Make prediction
            predicted_scaled = current_model.predict(input_seq, verbose=0)[0][0]
            
            # Add prediction to sequence for next iteration
            last_sequence.append([predicted_scaled])
            
            # Convert to actual price
            predicted_price = scaler.inverse_transform([[predicted_scaled]])[0][0]
            predictions.append(float(predicted_price))
        
        return predictions
        
    except Exception as e:
        print(f"Multi-day LSTM prediction error: {e}")
        # Fallback to technical analysis
        for day in range(days):
            pred = predict_with_technical_analysis(hist, current_price)
            predictions.append(pred)
            current_price = pred
        return predictions

def predict_next_day_lstm(hist, current_price):
    """Predict next day price using LSTM model"""
    try:
        # Load model if not already loaded
        current_model = load_lstm_model()
        
        if current_model is None:
            # Fallback: Use technical analysis if model not available
            return predict_with_technical_analysis(hist, current_price)
        
        # Import sklearn when needed
        from sklearn.preprocessing import MinMaxScaler
        
        # Prepare data for LSTM
        close_prices = hist['Close'].values.reshape(-1, 1)
        
        # Scale data
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(close_prices)
        
        # Use last 60 days for prediction
        sequence_length = 60
        if len(scaled_data) < sequence_length:
            sequence_length = len(scaled_data)
        
        last_sequence = scaled_data[-sequence_length:]
        last_sequence = last_sequence.reshape(1, sequence_length, 1)
        
        # Make prediction
        predicted_scaled = current_model.predict(last_sequence, verbose=0)
        predicted_price = scaler.inverse_transform(predicted_scaled)[0][0]
        
        return float(predicted_price)
        
    except Exception as e:
        print(f"LSTM prediction error: {e}")
        # Fallback to technical analysis
        return predict_with_technical_analysis(hist, current_price)

def predict_with_technical_analysis(hist, current_price):
    """Fallback prediction using technical indicators"""
    try:
        last_row = hist.iloc[-1]
        
        # Calculate trend and momentum
        sma_20 = last_row['SMA_20']
        sma_50 = last_row['SMA_50']
        rsi = last_row['RSI']
        macd = last_row['MACD']
        
        # Calculate recent trend
        recent_prices = hist['Close'].tail(5).values
        trend = (recent_prices[-1] - recent_prices[0]) / recent_prices[0]
        
        # Calculate prediction based on indicators
        prediction_change = 0
        
        # RSI-based prediction
        if rsi < 30:  # Oversold
            prediction_change += 0.01
        elif rsi > 70:  # Overbought
            prediction_change -= 0.01
        
        # Moving average crossover
        if current_price > sma_20 and sma_20 > sma_50:
            prediction_change += 0.005
        elif current_price < sma_20 and sma_20 < sma_50:
            prediction_change -= 0.005
        
        # MACD momentum
        if macd > 0:
            prediction_change += 0.003
        else:
            prediction_change -= 0.003
        
        # Apply trend
        prediction_change += trend * 0.3
        
        predicted_price = current_price * (1 + prediction_change)
        return predicted_price
        
    except Exception as e:
        print(f"Technical analysis prediction error: {e}")
        # If all fails, predict slight upward trend
        return current_price * 1.002

@app.route('/old_predict', methods=['GET', 'POST'])
def predict_stock_old():
    """Legacy prediction route - kept for compatibility"""
    if request.method == "GET":
        return render_template('home.html', results=None, chart_data=None, prediction_data=None)

    else:
        ticker = request.form.get('ticker').upper()
        days_ahead = int(request.form.get('days_ahead', 7))
        
        # Fetch daily data using Yahoo Finance (last 100 days)
        try:
            # Download stock data
            stock = yf.Ticker(ticker)
            daily_data = yf.download(ticker, period='6mo', interval='1d', auto_adjust=False)
            
            # Handle MultiIndex columns if present
            if isinstance(daily_data.columns, pd.MultiIndex):
                daily_data.columns = daily_data.columns.droplevel(1)
            
            daily_data.index = pd.to_datetime(daily_data.index)
            
            if daily_data.empty:
                return render_template('home.html', results=f"No data found for ticker: {ticker}. Please check the ticker symbol.", chart_data=None)
            
            # Calculate technical indicators
            daily_data['SMA_20'] = daily_data['Close'].rolling(window=20).mean()
            daily_data['SMA_50'] = daily_data['Close'].rolling(window=50).mean()
            daily_data['RSI'] = ta.momentum.RSIIndicator(daily_data['Close']).rsi()
            daily_data['MACD'] = ta.trend.MACD(daily_data['Close']).macd()
            
            # Drop NaN values
            daily_data = daily_data.dropna()
            
            if daily_data.empty:
                return render_template('home.html', results="Not enough data for indicators.", chart_data=None)
            
            last_daily_row = daily_data.iloc[-1]
            
        except Exception as e:
            return render_template('home.html', results=f"Error fetching data: {str(e)}", chart_data=None)
        
        # Prepare custom data with all features
        custom_input = customdata(
            close=float(last_daily_row['Close']),
            volume=float(last_daily_row['Volume']),
            sma_20=float(last_daily_row['SMA_20']),
            sma_50=float(last_daily_row['SMA_50']),
            rsi=float(last_daily_row['RSI']),
            macd=float(last_daily_row['MACD']),
            days_ahead=days_ahead
        )
        
        data_df = custom_input.data_frame()
        
        predict_pipeline = predict(days_ahead=days_ahead)
        try:
            predictions = predict_pipeline.get_predict(data_df)
        except ValueError as e:
            return render_template('home.html', results=str(e), chart_data=None, prediction_data=None)
        
        # Get today's date and calculate future dates
        today = datetime.now()
        current_price = float(last_daily_row['Close'])
        
        # Create prediction data with dates
        prediction_data = []
        for i, pred in enumerate(predictions):
            future_date = today + timedelta(days=i+1)
            change = pred - current_price
            change_percent = (change / current_price) * 100
            prediction_data.append({
                'day': i + 1,
                'date': future_date.strftime('%Y-%m-%d'),
                'day_name': future_date.strftime('%A'),
                'price': f"${pred:.2f}",
                'change': f"${change:+.2f}",
                'change_percent': f"{change_percent:+.2f}%",
                'trend': 'up' if change > 0 else 'down'
            })
        
        # Today's info
        today_info = {
            'date': today.strftime('%Y-%m-%d'),
            'day_name': today.strftime('%A'),
            'price': f"${current_price:.2f}",
            'ticker': ticker
        }
        
        results = f"Current Price (Today): ${current_price:.2f}"
        
        # Chart data with dates
        historical_data = daily_data.tail(30)
        historical_dates = [date.strftime('%m/%d') for date in historical_data.index]
        historical_prices = historical_data['Close'].tolist()
        
        # Future dates for predictions
        future_dates = [(today + timedelta(days=i+1)).strftime('%m/%d') for i in range(len(predictions))]
        predicted_prices = predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions)
        
        chart_data = {
            'historical_dates': historical_dates,
            'historical_prices': historical_prices,
            'future_dates': future_dates,
            'predicted_prices': predicted_prices,
            'current_price': current_price
        }
        
        return render_template('home.html', 
                             results=results, 
                             chart_data=chart_data, 
                             prediction_data=prediction_data,
                             today_info=today_info)

@app.route('/toggle_theme', methods=['POST'])
def toggle_theme():
    return jsonify({'theme': 'dark'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)