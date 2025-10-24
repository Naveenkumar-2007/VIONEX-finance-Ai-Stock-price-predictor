#!/bin/bash
set -e

echo "====== Azure Startup Script ======"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "Checking Python environment..."
python --version
pip --version

echo ""
echo "Checking if app.py exists..."
if [ -f "app.py" ]; then
    echo "✅ app.py found"
else
    echo "❌ app.py NOT found!"
fi

echo ""
echo "Checking if artifacts directory exists..."
if [ -d "artifacts" ]; then
    echo "✅ artifacts directory found"
    echo "Contents of artifacts:"
    ls -la artifacts/
else
    echo "❌ artifacts directory NOT found - creating it..."
    mkdir -p artifacts
fi

echo ""
echo "Checking if model file exists..."
if [ -f "artifacts/stock_lstm_model.h5" ]; then
    echo "✅ Model file found"
else
    echo "⚠️  Model file NOT found (app will use demo mode)"
fi

echo ""
echo "Starting Gunicorn..."
exec gunicorn wsgi:app --bind=0.0.0.0:8000 --timeout 600 --workers 2 --access-logfile - --error-logfile - --log-level info
