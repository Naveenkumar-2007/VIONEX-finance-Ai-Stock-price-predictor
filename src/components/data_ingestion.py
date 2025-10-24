import pandas as pd
from sklearn.model_selection import train_test_split
import ta
import os
from datetime import datetime, timedelta
import sys

# Add parent directory to path to import stock_api
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from stock_api import get_stock_history

class DataIngestion:
    def __init__(self, ticker='AAPL', start_date='2020-01-01', end_date=None):
        self.ticker = ticker
        self.start_date = start_date
        # Auto-update end_date to today if not provided
        self.end_date = end_date if end_date else datetime.now().strftime('%Y-%m-%d')
        
    def fetch_data(self):
        """Fetch stock data using Twelve Data API"""
        # Calculate number of days to fetch
        start = datetime.strptime(self.start_date, '%Y-%m-%d')
        end = datetime.strptime(self.end_date, '%Y-%m-%d')
        days = (end - start).days
        
        print(f"📊 Fetching {self.ticker} data from {self.start_date} to {self.end_date} ({days} days)")
        
        # Twelve Data API - fetch with appropriate interval
        data = get_stock_history(self.ticker, days=min(days, 5000))  # API limit: 5000 points
        
        if data.empty:
            raise ValueError(f"No data fetched for {self.ticker}")
        
        return data
    
    def preprocess(self, data):
        if 'Close' not in data.columns:
            raise ValueError(f"'Close' column not found in data. Columns: {data.columns}")
        close_series = data['Close'].squeeze()
        data['SMA_20'] = close_series.rolling(window=20).mean()
        data['SMA_50'] = close_series.rolling(window=50).mean()
        data['RSI'] = ta.momentum.RSIIndicator(close_series).rsi()
        data['MACD'] = ta.trend.MACD(close_series).macd()
        data = data.dropna()
        return data[['Close', 'Volume', 'SMA_20', 'SMA_50', 'RSI', 'MACD']]
    
    def split_data(self, data, test_size=0.2):
        train, test = train_test_split(data, test_size=test_size, shuffle=False)
        return train, test
    
    def initiate_data_ingestion(self):
        os.makedirs('artifacts', exist_ok=True)
        data = self.fetch_data()
        processed_data = self.preprocess(data)
        processed_data.to_csv('artifacts/raw_stock_data.csv', index=False)
        
        train_data, test_data = self.split_data(processed_data)
        train_data.to_csv('artifacts/train_stock_data.csv', index=False)
        test_data.to_csv('artifacts/test_stock_data.csv', index=False)
        
        return train_data, test_data

if __name__ == "__main__":
    obj = DataIngestion()
    obj.initiate_data_ingestion()