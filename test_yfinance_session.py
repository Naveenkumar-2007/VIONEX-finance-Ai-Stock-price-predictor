"""
Test Yahoo Finance with custom session headers to avoid being blocked
"""
import yfinance as yf
import requests
from datetime import datetime, timedelta

# Configure session with browser-like headers
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
})

print("="*60)
print("Testing Yahoo Finance with Custom Session Headers")
print("="*60)

tickers = ['AAPL', 'GOOGL', 'MSFT']

for ticker_symbol in tickers:
    print(f"\n📊 Testing {ticker_symbol}...")
    try:
        # Create Ticker with custom session
        stock = yf.Ticker(ticker_symbol, session=session)
        
        # Fetch historical data
        hist = stock.history(period='60d')
        
        if not hist.empty:
            latest_price = hist['Close'].iloc[-1]
            latest_date = hist.index[-1].strftime('%Y-%m-%d')
            print(f"   ✅ SUCCESS!")
            print(f"   Rows fetched: {len(hist)}")
            print(f"   Latest price: ${latest_price:.2f} on {latest_date}")
        else:
            print(f"   ❌ Empty data returned")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "="*60)
print("Test Complete")
print("="*60)
