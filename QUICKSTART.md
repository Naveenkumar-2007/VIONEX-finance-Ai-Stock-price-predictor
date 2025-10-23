# Stock Prediction App - Quick Start Guide

## ✅ Changes Made - Replaced Alpha Vantage with Yahoo Finance

### What Was Changed:
1. **app.py**: Replaced Alpha Vantage API with Yahoo Finance (yfinance)
   - No API key needed anymore
   - No rate limits (25 requests/day removed)
   - Fetches data directly from Yahoo Finance
   - Same functionality with better reliability

2. **requirements.txt**: Removed `alpha_vantage` dependency

### Benefits:
- ✅ **No API Rate Limits**: Yahoo Finance has no daily request limits
- ✅ **No API Key Required**: No need to manage API keys or environment variables
- ✅ **Free Forever**: Completely free to use
- ✅ **Real-time Data**: Get latest stock data without restrictions
- ✅ **Same Features**: All technical indicators (SMA, RSI, MACD) still work

## How to Run the Application

### 1. Start the Flask Web App
```powershell
python app.py
```

The app will start on: http://127.0.0.1:5000

### 2. Use the Web Interface
- Open your browser and go to: http://127.0.0.1:5000
- Enter any stock ticker (e.g., AAPL, GOOGL, MSFT, TSLA)
- Select how many days ahead to predict (1-30 days)
- Click "Predict" to get stock price predictions

### 3. Test the Prediction Pipeline
```powershell
python test_prediction.py
```

This will test predictions for AAPL stock for the next 5 days.

### 4. Retrain the Model
```powershell
python auto_retrain.py
```

This will:
- Download fresh stock data
- Process and transform the data
- Train a new LSTM model
- Save the model to artifacts/

## Supported Stock Tickers

You can use any valid stock ticker symbol from Yahoo Finance, including:
- US Stocks: AAPL, GOOGL, MSFT, TSLA, AMZN, META, NVDA, etc.
- International: Use the full ticker (e.g., 0700.HK for Tencent)
- Crypto: BTC-USD, ETH-USD, etc.
- Indices: ^GSPC (S&P 500), ^DJI (Dow Jones), ^IXIC (NASDAQ)

## Technical Indicators Calculated

The app automatically calculates:
- **SMA_20**: 20-day Simple Moving Average
- **SMA_50**: 50-day Simple Moving Average  
- **RSI**: Relative Strength Index
- **MACD**: Moving Average Convergence Divergence

## Troubleshooting

### If you get "No data found for ticker":
- Make sure the ticker symbol is correct
- Try the ticker on https://finance.yahoo.com first
- Some tickers may need exchange suffix (e.g., .L for London)

### If predictions seem off:
- The model was trained on historical data
- Retrain the model with: `python auto_retrain.py`
- Stock predictions are estimates and not financial advice

## File Structure

```
app.py                          # Flask web application (UPDATED - now uses Yahoo Finance)
test_prediction.py              # Test script for predictions (NEW)
auto_retrain.py                 # Automatic model retraining
requirements.txt                # Dependencies (UPDATED - removed alpha_vantage)

src/
├── components/
│   ├── data_ingestion.py       # Fetch and preprocess stock data
│   ├── data_transformation.py  # Transform data for ML
│   └── model_trainer.py        # Train LSTM model
└── pipeline/
    └── predict_pipeline.py     # Make predictions

artifacts/                       # Generated files
├── stock_lstm_model.h5         # Trained model
├── scaler.pkl                  # Data scaler
├── train_stock_data.csv        # Training data
└── test_stock_data.csv         # Testing data

templates/                       # HTML templates
├── index.html                  # Home page
└── home.html                   # Prediction page

static/                          # CSS & JavaScript
├── styles.css                  # Styling
└── script.js                   # Frontend logic
```

## Next Steps

1. **Start the app**: `python app.py`
2. **Open browser**: http://127.0.0.1:5000
3. **Enter a ticker**: Try AAPL, GOOGL, or any stock
4. **Get predictions**: See predicted prices for future days

Enjoy your stock prediction app with unlimited free data! 🚀📈
