"""
Stock Data API Module using Twelve Data
Provides reliable stock data access from cloud hosting
"""
import requests
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TWELVE_DATA_API_KEY = os.getenv('TWELVE_DATA_API_KEY', '4a46541183144fbdad78a5d3ac844d87')
BASE_URL = 'https://api.twelvedata.com'

def get_stock_history(ticker, days=60, interval='1day'):
    """
    Fetch historical stock data from Twelve Data API
    
    Args:
        ticker (str): Stock symbol (e.g., 'AAPL', 'GOOGL')
        days (int): Number of days of historical data (default: 60)
        interval (str): Time interval - '1min', '5min', '15min', '30min', '1h', '1day', '1week', '1month'
    
    Returns:
        pd.DataFrame: Historical stock data with columns [Open, High, Low, Close, Volume]
        Returns empty DataFrame if request fails
    """
    try:
        print(f"📊 Fetching {ticker} data from Twelve Data API...")
        
        url = f'{BASE_URL}/time_series'
        params = {
            'symbol': ticker,
            'interval': interval,
            'outputsize': min(days, 5000),  # Max 5000 data points
            'apikey': TWELVE_DATA_API_KEY,
            'format': 'JSON'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Check for errors
        if 'status' in data and data['status'] == 'error':
            print(f"❌ API Error: {data.get('message', 'Unknown error')}")
            return pd.DataFrame()
        
        if 'values' not in data:
            print(f"❌ No data returned for {ticker}")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data['values'])
        
        # Convert datetime
        df['datetime'] = pd.to_datetime(df['datetime'])
        df.set_index('datetime', inplace=True)
        df = df.sort_index()
        
        # Convert columns to float
        for col in ['open', 'high', 'low', 'close', 'volume']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Rename columns to match yfinance format
        df.rename(columns={
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }, inplace=True)
        
        # Add Dividends and Stock Splits columns (set to 0 for compatibility)
        df['Dividends'] = 0.0
        df['Stock Splits'] = 0.0
        
        print(f"✅ Successfully fetched {len(df)} data points for {ticker}")
        print(f"   Date range: {df.index[0].strftime('%Y-%m-%d')} to {df.index[-1].strftime('%Y-%m-%d')}")
        print(f"   Latest price: ${df['Close'].iloc[-1]:.2f}")
        
        return df
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error fetching {ticker}: {e}")
        return pd.DataFrame()
    except Exception as e:
        print(f"❌ Error processing {ticker} data: {e}")
        return pd.DataFrame()


def get_intraday_data(ticker, interval='5min', outputsize=78):
    """
    Fetch intraday stock data
    
    Args:
        ticker (str): Stock symbol
        interval (str): Time interval ('1min', '5min', '15min', '30min', '1h')
        outputsize (int): Number of data points (default: 78 = full day of 5min data)
    
    Returns:
        pd.DataFrame: Intraday stock data
    """
    try:
        print(f"📈 Fetching intraday data for {ticker}...")
        
        url = f'{BASE_URL}/time_series'
        params = {
            'symbol': ticker,
            'interval': interval,
            'outputsize': outputsize,
            'apikey': TWELVE_DATA_API_KEY,
            'format': 'JSON'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'values' not in data:
            print(f"⚠️ No intraday data available for {ticker}")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data['values'])
        df['datetime'] = pd.to_datetime(df['datetime'])
        df.set_index('datetime', inplace=True)
        df = df.sort_index()
        
        # Convert to float
        for col in ['open', 'high', 'low', 'close', 'volume']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Rename columns
        df.rename(columns={
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }, inplace=True)
        
        print(f"✅ Fetched {len(df)} intraday data points")
        return df
        
    except Exception as e:
        print(f"❌ Error fetching intraday data: {e}")
        return pd.DataFrame()


def get_real_time_price(ticker):
    """
    Get real-time price quote
    
    Args:
        ticker (str): Stock symbol
    
    Returns:
        dict: Real-time price data
    """
    try:
        url = f'{BASE_URL}/quote'
        params = {
            'symbol': ticker,
            'apikey': TWELVE_DATA_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            'price': float(data.get('close', 0)),
            'open': float(data.get('open', 0)),
            'high': float(data.get('high', 0)),
            'low': float(data.get('low', 0)),
            'volume': int(data.get('volume', 0)),
            'timestamp': data.get('datetime', '')
        }
        
    except Exception as e:
        print(f"❌ Error fetching real-time price: {e}")
        return None


# Test function
if __name__ == "__main__":
    print("="*60)
    print("Testing Twelve Data API")
    print("="*60)
    
    # Test with popular stocks
    tickers = ['AAPL', 'GOOGL', 'MSFT']
    
    for ticker in tickers:
        hist = get_stock_history(ticker, days=60)
        if not hist.empty:
            print(f"\n✅ {ticker} - Last 5 days:")
            print(hist[['Open', 'High', 'Low', 'Close', 'Volume']].tail())
        else:
            print(f"\n❌ {ticker} - Failed to fetch data")
        print("-"*60)
