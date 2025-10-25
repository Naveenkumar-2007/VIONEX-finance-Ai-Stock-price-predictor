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

TWELVE_DATA_API_KEY = os.getenv('TWELVE_DATA_API_KEY', 'fbbf800ba2694b4a8faf45c487de8342')
BASE_URL = 'https://api.twelvedata.com'

# Finnhub API Configuration
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', 'd3ueuhhr01qil4apoka0d3ueuhhr01qil4apokag')
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

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
        print(f" Fetching {ticker} data from Twelve Data API...")
        
        url = f'{BASE_URL}/time_series'
        params = {
            'symbol': ticker,
            'interval': interval,
            'outputsize': min(days, 5000),  # Max 5000 data points
            'apikey': TWELVE_DATA_API_KEY,
            'format': 'JSON'
        }
        
        response = requests.get(url, params=params, timeout=30)
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
    Fetch intraday stock data - tries multiple intervals to get the best available data
    
    Args:
        ticker (str): Stock symbol
        interval (str): Time interval ('1min', '5min', '15min', '30min', '1h')
        outputsize (int): Number of data points (default: 78 = full day of 5min data)
    
    Returns:
        pd.DataFrame: Intraday stock data
    """
    # Try different intervals in order of preference
    intervals_to_try = [interval, '1min', '5min', '15min', '30min', '1h']
    
    for try_interval in intervals_to_try:
        try:
            print(f"📈 Fetching intraday data for {ticker} with {try_interval} interval...")
            
            url = f'{BASE_URL}/time_series'
            params = {
                'symbol': ticker,
                'interval': try_interval,
                'outputsize': outputsize,
                'apikey': TWELVE_DATA_API_KEY,
                'format': 'JSON'
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if 'values' not in data or not data['values']:
                print(f"⚠️ No data for {try_interval}, trying next interval...")
                continue
            
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
            
            # Filter to today's data only (if available)
            today = datetime.now().date()
            df_today = df[df.index.date == today]
            
            if not df_today.empty:
                print(f"✅ Fetched {len(df_today)} intraday data points for today ({try_interval})")
                return df_today
            else:
                print(f"✅ Fetched {len(df)} recent intraday data points ({try_interval})")
                return df
            
        except Exception as e:
            print(f"⚠️ Error with {try_interval}: {e}")
            continue
    
    # If all intervals fail, return empty DataFrame
    print(f"❌ No intraday data available for {ticker}")
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
        
        response = requests.get(url, params=params, timeout=30)
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


def get_stock_fundamentals(ticker):
    """
    Get stock fundamental data (company info, market cap, P/E ratio)
    
    Args:
        ticker (str): Stock symbol
    
    Returns:
        dict: Fundamental data including market cap, P/E ratio, company name
    """
    try:
        print(f"📊 Fetching fundamentals for {ticker}...")
        
        # Get statistics endpoint for fundamentals
        url = f'{BASE_URL}/statistics'
        params = {
            'symbol': ticker,
            'apikey': TWELVE_DATA_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        stats = response.json()
        
        # Get company profile/logo endpoint for company name
        profile_url = f'{BASE_URL}/profile'
        profile_params = {
            'symbol': ticker,
            'apikey': TWELVE_DATA_API_KEY
        }
        
        profile_response = requests.get(profile_url, params=profile_params, timeout=30)
        profile_data = {}
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
        
        # Extract data
        company_name = profile_data.get('name', ticker)
        market_cap = stats.get('statistics', {}).get('valuations_metrics', {}).get('market_capitalization', None)
        pe_ratio = stats.get('statistics', {}).get('valuations_metrics', {}).get('trailing_pe', None)
        
        # Also try from quote endpoint as fallback
        if not market_cap or not pe_ratio:
            quote_url = f'{BASE_URL}/quote'
            quote_params = {
                'symbol': ticker,
                'apikey': TWELVE_DATA_API_KEY
            }
            quote_response = requests.get(quote_url, params=quote_params, timeout=30)
            if quote_response.status_code == 200:
                quote_data = quote_response.json()
                if not company_name or company_name == ticker:
                    company_name = quote_data.get('name', ticker)
        
        print(f"✅ Fundamentals: {company_name}, Market Cap: {market_cap}, P/E: {pe_ratio}")
        
        return {
            'company_name': company_name,
            'market_cap': market_cap,
            'pe_ratio': pe_ratio
        }
        
    except Exception as e:
        print(f"❌ Error fetching fundamentals: {e}")
        return {
            'company_name': ticker,
            'market_cap': None,
            'pe_ratio': None
        }


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


# ===== FINNHUB API FUNCTIONS =====

def get_company_news(ticker, days=7):
    """
    Fetch company news from Finnhub API
    
    Args:
        ticker (str): Stock symbol
        days (int): Number of days of news to fetch (default: 7)
    
    Returns:
        list: List of news articles with title, summary, url, source, image, and timestamp
    """
    try:
        print(f"📰 Fetching news for {ticker} from Finnhub...")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = f'{FINNHUB_BASE_URL}/company-news'
        params = {
            'symbol': ticker,
            'from': start_date.strftime('%Y-%m-%d'),
            'to': end_date.strftime('%Y-%m-%d'),
            'token': FINNHUB_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        news_data = response.json()
        
        if not news_data:
            print(f"⚠️ No news found for {ticker}")
            return []
        
        # Format news articles
        news_articles = []
        for article in news_data[:10]:  # Limit to 10 most recent
            news_articles.append({
                'headline': article.get('headline', 'No headline'),
                'summary': article.get('summary', 'No summary available'),
                'source': article.get('source', 'Unknown'),
                'url': article.get('url', '#'),
                'image': article.get('image', ''),
                'datetime': datetime.fromtimestamp(article.get('datetime', 0)).strftime('%Y-%m-%d %H:%M'),
                'timestamp': article.get('datetime', 0)
            })
        
        print(f"✅ Fetched {len(news_articles)} news articles for {ticker}")
        return news_articles
        
    except Exception as e:
        print(f"❌ Error fetching news from Finnhub: {e}")
        return []


def get_sentiment_analysis(ticker):
    """
    Fetch sentiment analysis from Finnhub API
    
    Args:
        ticker (str): Stock symbol
    
    Returns:
        dict: Sentiment data including overall sentiment, score, and breakdown
    """
    try:
        print(f"🎭 Fetching sentiment analysis for {ticker} from Finnhub...")
        
        # Get news sentiment
        url = f'{FINNHUB_BASE_URL}/news-sentiment'
        params = {
            'symbol': ticker,
            'token': FINNHUB_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=30)
        
        # If news-sentiment not available, analyze company news
        if response.status_code != 200 or not response.json():
            print("⚠️ Using alternative sentiment calculation from news...")
            return calculate_sentiment_from_news(ticker)
        
        sentiment_data = response.json()
        
        # Extract sentiment metrics
        buzz = sentiment_data.get('buzz', {})
        sentiment = sentiment_data.get('sentiment', {})
        
        overall_score = sentiment.get('bearishPercent', 0) - sentiment.get('bullishPercent', 0)
        
        # Determine sentiment label
        if overall_score > 0.2:
            sentiment_label = 'STRONG BUY'
            sentiment_class = 'positive'
        elif overall_score > 0:
            sentiment_label = 'BUY'
            sentiment_class = 'positive'
        elif overall_score > -0.2:
            sentiment_label = 'HOLD'
            sentiment_class = 'neutral'
        else:
            sentiment_label = 'SELL'
            sentiment_class = 'negative'
        
        result = {
            'sentiment': sentiment_label,
            'sentiment_class': sentiment_class,
            'score': round(overall_score, 2),
            'bullish_percent': sentiment.get('bullishPercent', 0),
            'bearish_percent': sentiment.get('bearishPercent', 0),
            'buzz_articles': buzz.get('articlesInLastWeek', 0),
            'buzz_score': buzz.get('buzz', 0)
        }
        
        print(f"✅ Sentiment: {sentiment_label} (Score: {overall_score:.2f})")
        return result
        
    except Exception as e:
        print(f"❌ Error fetching sentiment from Finnhub: {e}")
        return calculate_sentiment_from_news(ticker)


def calculate_sentiment_from_news(ticker):
    """
    Calculate sentiment from news headlines (fallback method)
    
    Args:
        ticker (str): Stock symbol
    
    Returns:
        dict: Calculated sentiment data
    """
    try:
        news = get_company_news(ticker, days=7)
        
        if not news:
            return {
                'sentiment': 'NEUTRAL',
                'sentiment_class': 'neutral',
                'score': 0,
                'bullish_percent': 50,
                'bearish_percent': 50,
                'buzz_articles': 0,
                'buzz_score': 0
            }
        
        # Simple sentiment analysis based on keywords
        positive_keywords = ['surge', 'gain', 'profit', 'growth', 'high', 'beat', 'success', 'bullish', 'rise', 'up', 'strong', 'outperform']
        negative_keywords = ['fall', 'loss', 'decline', 'low', 'miss', 'weak', 'bearish', 'down', 'drop', 'underperform']
        
        positive_count = 0
        negative_count = 0
        
        for article in news:
            headline_lower = article['headline'].lower()
            summary_lower = article['summary'].lower()
            text = headline_lower + ' ' + summary_lower
            
            for keyword in positive_keywords:
                if keyword in text:
                    positive_count += 1
            
            for keyword in negative_keywords:
                if keyword in text:
                    negative_count += 1
        
        total = positive_count + negative_count
        if total == 0:
            bullish_percent = 50
            bearish_percent = 50
        else:
            bullish_percent = (positive_count / total) * 100
            bearish_percent = (negative_count / total) * 100
        
        score = (bullish_percent - bearish_percent) / 100
        
        # Determine sentiment label
        if score > 0.2:
            sentiment_label = 'STRONG BUY'
            sentiment_class = 'positive'
        elif score > 0:
            sentiment_label = 'BUY'
            sentiment_class = 'positive'
        elif score > -0.2:
            sentiment_label = 'HOLD'
            sentiment_class = 'neutral'
        else:
            sentiment_label = 'SELL'
            sentiment_class = 'negative'
        
        return {
            'sentiment': sentiment_label,
            'sentiment_class': sentiment_class,
            'score': round(score, 2),
            'bullish_percent': round(bullish_percent, 2),
            'bearish_percent': round(bearish_percent, 2),
            'buzz_articles': len(news),
            'buzz_score': min(len(news) / 10, 1.0)
        }
        
    except Exception as e:
        print(f"❌ Error calculating sentiment: {e}")
        return {
            'sentiment': 'NEUTRAL',
            'sentiment_class': 'neutral',
            'score': 0,
            'bullish_percent': 50,
            'bearish_percent': 50,
            'buzz_articles': 0,
            'buzz_score': 0
        }


def get_quote_data(ticker):
    """
    Get real-time quote data from Finnhub
    
    Args:
        ticker (str): Stock symbol
    
    Returns:
        dict: Real-time quote with current price, change, percent change, high, low, open, previous close
    """
    try:
        print(f"💹 Fetching real-time quote for {ticker} from Finnhub...")
        
        url = f'{FINNHUB_BASE_URL}/quote'
        params = {
            'symbol': ticker,
            'token': FINNHUB_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        quote = response.json()
        
        current = quote.get('c', 0)  # Current price
        previous = quote.get('pc', current)  # Previous close
        change = current - previous
        change_percent = (change / previous * 100) if previous != 0 else 0
        
        result = {
            'current': float(current),
            'high': float(quote.get('h', current)),
            'low': float(quote.get('l', current)),
            'open': float(quote.get('o', current)),
            'previous_close': float(previous),
            'change': float(change),
            'change_percent': float(change_percent),
            'timestamp': quote.get('t', int(datetime.now().timestamp()))
        }
        
        print(f"✅ Quote: ${current:.2f} ({change:+.2f}, {change_percent:+.2f}%)")
        return result
        
    except Exception as e:
        print(f"❌ Error fetching quote from Finnhub: {e}")
        return None


def get_company_profile(ticker):
    """
    Get company profile from Finnhub
    
    Args:
        ticker (str): Stock symbol
    
    Returns:
        dict: Company profile with name, market cap, industry, etc.
    """
    try:
        print(f"🏢 Fetching company profile for {ticker} from Finnhub...")
        
        url = f'{FINNHUB_BASE_URL}/stock/profile2'
        params = {
            'symbol': ticker,
            'token': FINNHUB_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        profile = response.json()
        
        result = {
            'name': profile.get('name', ticker),
            'ticker': profile.get('ticker', ticker),
            'market_cap': profile.get('marketCapitalization', 0),
            'industry': profile.get('finnhubIndustry', 'N/A'),
            'logo': profile.get('logo', ''),
            'country': profile.get('country', 'US'),
            'currency': profile.get('currency', 'USD'),
            'exchange': profile.get('exchange', 'NASDAQ')
        }
        
        print(f"✅ Company: {result['name']} ({result['industry']})")
        return result
        
    except Exception as e:
        print(f"❌ Error fetching company profile from Finnhub: {e}")
        return {
            'name': ticker,
            'ticker': ticker,
            'market_cap': 0,
            'industry': 'N/A',
            'logo': '',
            'country': 'US',
            'currency': 'USD',
            'exchange': 'NASDAQ'
        }


def get_company_metrics(ticker):
    """Fetch fundamental metrics (including P/E ratio) from Finnhub."""
    try:
        print(f"📊 Fetching fundamental metrics for {ticker} from Finnhub...")

        url = f'{FINNHUB_BASE_URL}/stock/metric'
        params = {
            'symbol': ticker,
            'metric': 'all',
            'token': FINNHUB_API_KEY
        }

        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        payload = response.json() or {}
        metrics = payload.get('metric', {}) or {}

        pe_candidates = [
            metrics.get('peBasicExclExtraTTM'),
            metrics.get('peBasicInclExtraTTM'),
            metrics.get('peNormalizedAnnual'),
            metrics.get('trailingPE'),
            metrics.get('peTTM')
        ]

        pe_ratio = next(
            (float(val) for val in pe_candidates if isinstance(val, (int, float)) and not pd.isna(val)),
            None
        )

        eps_candidates = [
            metrics.get('epsBasicExclExtraTTM'),
            metrics.get('epsBasicInclExtraTTM'),
            metrics.get('epsNormalizedAnnual'),
            metrics.get('epsDilutedTTM')
        ]

        eps = next(
            (float(val) for val in eps_candidates if isinstance(val, (int, float)) and not pd.isna(val)),
            None
        )

        print("✅ Metrics retrieved" if pe_ratio is not None else "⚠️ P/E ratio unavailable from metrics response")

        return {
            'pe_ratio': pe_ratio,
            'eps': eps
        }

    except Exception as exc:
        print(f"❌ Error fetching metrics from Finnhub: {exc}")
        return {
            'pe_ratio': None,
            'eps': None
        }
