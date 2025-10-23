# VIONEX Finance MLOps System - Quick Start Guide

## 🚀 What is MLOps?

**MLOps (Machine Learning Operations)** automates the entire machine learning lifecycle:
- ✅ Automatic model training every hour
- ✅ Version control for all models
- ✅ Performance tracking and monitoring
- ✅ Best model selection
- ✅ Production deployment

**Result**: Your predictions are ALWAYS based on the latest trained models with fresh data!

## 📁 Clean Folder Structure

```
sell/
├── mlops/                          # ← MLOps System (NEW)
│   ├── __init__.py                 # Package initialization
│   ├── config.py                   # Configuration settings
│   ├── registry.py                 # Model versioning & management
│   ├── training_pipeline.py        # Automated training
│   ├── scheduler.py                # Background scheduler
│   ├── test_mlops.py               # Test suite
│   ├── README.md                   # Detailed documentation
│   ├── model_registry/             # Versioned models storage
│   │   ├── metadata.json           # Model tracking
│   │   └── AAPL_v1_*/              # Model versions
│   ├── logs/                       # Training logs
│   │   ├── tensorboard/            # TensorBoard logs
│   │   └── training_errors.log     # Error logs
│   └── checkpoints/                # Training checkpoints
│
├── src/                            # Original source code
│   ├── components/
│   │   ├── data_ingestion.py
│   │   ├── data_transformation.py
│   │   └── model_trainer.py
│   └── pipeline/
│       └── predict_pipeline.py
│
├── artifacts/                      # Model artifacts
│   ├── AAPL_lstm_model.h5          # Trained models
│   └── AAPL_scaler.pkl             # Data scalers
│
├── templates/                      # Flask templates
│   └── dashboard.html
│
├── static/                         # Static assets
│   ├── dashboard.css
│   ├── dashboard.js
│   └── vionex-logo.png
│
├── app.py                          # Flask application
│
├── start_mlops_scheduler.bat       # ← Start auto-training (NEW)
├── train_single_stock.bat          # ← Train one stock (NEW)
├── train_all_stocks.bat            # ← Train all stocks (NEW)
└── test_mlops.bat                  # ← Test system (NEW)
```

## ⚡ Quick Start (3 Steps)

### Step 1: Test the System

```batch
test_mlops.bat
```

This verifies everything is set up correctly.

### Step 2: Train Initial Models

```batch
train_all_stocks.bat
```

Trains models for AAPL, TSLA, GOOGL, MSFT, AMZN (takes ~30 minutes)

### Step 3: Start Auto-Training

```batch
start_mlops_scheduler.bat
```

Now models will auto-train every hour! Leave this running.

## 🎯 How It Solves Your Problem

### ❌ Before MLOps:
```
1. Train model at 12:00 PM
2. Stop server
3. Restart at 2:00 PM
4. ❌ Model is 2 hours old
5. ❌ Predictions based on old patterns
6. ❌ Less accurate
```

### ✅ After MLOps:
```
1. Train model at 12:00 PM → Registered as AAPL v1
2. Train model at 1:00 PM → Registered as AAPL v2
3. Train model at 2:00 PM → Registered as AAPL v3
4. Stop server at 2:00 PM
5. Restart at 4:00 PM
6. ✅ App uses AAPL v3 (2 PM model)
7. ✅ Scheduler continues training v4, v5, v6...
8. ✅ Always uses best model
9. ✅ Maximum accuracy!
```

## 📊 Usage Examples

### Start Automated Training

```batch
# This runs forever, training every hour
start_mlops_scheduler.bat
```

### Train Single Stock Manually

```batch
train_single_stock.bat
# Enter: AAPL
```

### Train All Stocks Once

```batch
train_all_stocks.bat
```

### View Model Registry

```python
from mlops.registry import ModelRegistry

registry = ModelRegistry()

# Get best model for AAPL
best = registry.get_best_model('AAPL')
print(f"Version: v{best['version']}")
print(f"Val Loss: {best['metrics']['val_loss']:.6f}")

# List all AAPL models
models = registry.list_models('AAPL')
for m in models:
    print(f"v{m['version']}: {m['metrics']['val_loss']:.6f}")
```

## 🔄 Integration with Flask App

Your Flask app automatically uses the best models:

```python
# In app.py
from mlops.registry import ModelRegistry
from tensorflow.keras.models import load_model
import pickle

registry = ModelRegistry()

@app.route('/api/stock_data/<ticker>')
def get_stock_data(ticker):
    # Get best model from registry
    model_info = registry.get_best_model(ticker.upper())
    
    if model_info:
        # Load best model
        model = load_model(model_info['model_path'])
        with open(model_info['scaler_path'], 'rb') as f:
            scaler = pickle.load(f)
        
        print(f"✅ Using {ticker} v{model_info['version']}")
        print(f"📊 Val Loss: {model_info['metrics']['val_loss']:.6f}")
    
    # ... make predictions ...
```

## 📈 Monitoring

### View Training Logs

```bash
tensorboard --logdir=mlops/logs/tensorboard
# Open: http://localhost:6006
```

### Check Errors

```bash
type mlops\logs\training_errors.log
```

### View Registry

```bash
type mlops\model_registry\metadata.json
```

## ⚙️ Configuration

Edit `mlops/config.py`:

```python
# Change training interval
TRAINING_INTERVAL_HOURS = 2  # Train every 2 hours

# Change default stocks
DEFAULT_STOCKS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA']

# Change training parameters
DEFAULT_EPOCHS = 100  # More epochs = better accuracy (slower)
DEFAULT_BATCH_SIZE = 64
```

## 🎯 Best Practices

1. **Initial Setup**: Run `test_mlops.bat` first
2. **First Time**: Run `train_all_stocks.bat` to create initial models
3. **Production**: Always use `start_mlops_scheduler.bat`
4. **Monitoring**: Check TensorBoard regularly
5. **Updates**: Let scheduler run 24/7 for best results

## 📝 Key Features

### ✅ Model Versioning
- Every training creates a new version (v1, v2, v3...)
- All versions kept for rollback
- Best model automatically selected

### ✅ Performance Tracking
- Train/Validation/Test loss
- RMSE, MAE metrics
- Training duration
- Sample counts

### ✅ Automated Training
- Runs independently of Flask server
- Continues even if server stops
- Error recovery built-in
- Batch processing support

### ✅ Production Ready
- Clean code architecture
- Comprehensive logging
- Easy configuration
- Full test coverage

## 🚨 Troubleshooting

### Scheduler not running?
```bash
# Check if Python process is running
tasklist | findstr python
```

### Models not training?
```bash
# Check error log
type mlops\logs\training_errors.log
```

### Can't find model?
```python
from mlops.registry import ModelRegistry
registry = ModelRegistry()
models = registry.list_models('AAPL')
print(f"Found {len(models)} AAPL models")
```

## 📚 Documentation

- Full MLOps documentation: `mlops/README.md`
- API documentation: See individual Python files
- Configuration guide: `mlops/config.py`

## 🎉 Benefits

| Feature | Without MLOps | With MLOps |
|---------|--------------|------------|
| **Model Freshness** | Gets stale | Always fresh |
| **Prediction Accuracy** | Decreases over time | Stays high |
| **Manual Work** | Constant retraining | Fully automated |
| **Version Control** | None | Full history |
| **Monitoring** | Limited | Complete |
| **Reliability** | Depends on you | Automated |

---

**VIONEX Finance MLOps System v1.0.0**

For detailed documentation, see: `mlops/README.md`
