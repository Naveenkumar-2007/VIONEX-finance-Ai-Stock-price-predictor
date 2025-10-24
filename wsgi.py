import os
import sys

print("="*50)
print("DEPLOYMENT DIAGNOSTIC")
print("="*50)
print(f"Python Version: {sys.version}")
print(f"Current Directory: {os.getcwd()}")
print(f"Directory Contents: {os.listdir('.')}")
print(f"Python Path: {sys.path}")
print("="*50)

from app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)
