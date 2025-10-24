import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

print("="*50)
print("AZURE DEPLOYMENT DIAGNOSTIC")
print("="*50)
print(f"Python Version: {sys.version}")
print(f"Working Directory: {os.getcwd()}")
print(f"Files in Directory: {os.listdir('.')}")
print(f"Python Path: {sys.path}")
print(f"Environment Variables:")
print(f"  - PORT: {os.environ.get('PORT', 'Not Set')}")
print(f"  - WEBSITE_SITE_NAME: {os.environ.get('WEBSITE_SITE_NAME', 'Not Set')}")
print("="*50)

try:
    # Import Flask app
    from app import application as app
    print("✅ Successfully imported Flask app")
except ImportError as e:
    print(f"❌ Failed to import app: {e}")
    # Try alternative import
    try:
        from app import app
        print("✅ Successfully imported Flask app (alternative method)")
    except ImportError as e2:
        print(f"❌ Both import methods failed: {e2}")
        raise

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
