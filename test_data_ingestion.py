"""Test data ingestion with Twelve Data API"""
import sys
sys.path.insert(0, 'src/components')
from data_ingestion import DataIngestion

print("=" * 60)
print("Testing DataIngestion with Twelve Data API")
print("=" * 60)

# Test with AAPL
di = DataIngestion('AAPL', '2024-01-01', '2024-10-24')
data = di.fetch_data()

print(f"\n✅ Data fetched: {len(data)} rows")
print(f"Columns: {list(data.columns)}")
print(f"\nLatest price: ${data['Close'].iloc[-1]:.2f}")
print(f"Date range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
print(f"\nFirst 3 rows:")
print(data.head(3))
print(f"\nLast 3 rows:")
print(data.tail(3))

print("\n" + "=" * 60)
print("✅ Test passed! DataIngestion works with Twelve Data API")
print("=" * 60)
