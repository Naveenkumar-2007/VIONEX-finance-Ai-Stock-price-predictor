#!/bin/bash
set -e

echo "===== Azure Post-Build Script ====="
echo "Creating required directories..."
mkdir -p /home/site/wwwroot/artifacts
mkdir -p /home/site/wwwroot/mlops/logs
mkdir -p /home/site/wwwroot/mlops/model_registry

echo "Setting permissions..."
chmod -R 755 /home/site/wwwroot/artifacts
chmod -R 755 /home/site/wwwroot/mlops

echo "Verifying Python installation..."
python --version
pip --version

echo "Installing dependencies..."
python -m pip install --upgrade pip
pip install -r /home/site/wwwroot/requirements.txt

echo "Deployment complete!"
