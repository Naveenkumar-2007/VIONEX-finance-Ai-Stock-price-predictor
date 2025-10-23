# VIONEX Finance MLOps System

Complete Machine Learning Operations (MLOps) system for automated stock prediction model training, versioning, and deployment.

## 📁 Directory Structure

```
mlops/
├── __init__.py              # Package initialization
├── config.py                # Configuration settings
├── registry.py              # Model version control & management
├── training_pipeline.py     # Automated training pipeline
├── scheduler.py             # Background training scheduler
├── model_registry/          # Versioned model storage
│   └── metadata.json        # Model metadata and tracking
├── logs/                    # Training logs and TensorBoard
│   ├── tensorboard/         # TensorBoard visualization logs
│   └── training_errors.log  # Error logs
└── checkpoints/             # Model checkpoints during training
```

## 🚀 Features

### ✅ Automated Training
- **Scheduled Training**: Automatically trains models every hour
- **Batch Training**: Train multiple stocks simultaneously
- **Error Recovery**: Continues training other stocks if one fails

### ✅ Model Versioning
- **Version Control**: Tracks all model versions (v1, v2, v3...)
- **Performance Tracking**: Records metrics for each version
- **Best Model Selection**: Automatically selects best performing model

### ✅ Monitoring & Logging
- **TensorBoard Integration**: Visualize training progress
- **Detailed Metrics**: Track loss, RMSE, MAE, etc.
- **Error Logging**: All errors logged for debugging

### ✅ Production Ready
- **Independent Operation**: Runs separately from Flask server
- **Crash Recovery**: Automatic restart on failure
- **Clean Code**: Well-documented, modular architecture

## 🎯 Quick Start

### Option 1: Automated Scheduler (Recommended)

Train models automatically every hour:

```batch
start_mlops_scheduler.bat
```

This will:
1. Start the scheduler service
2. Train all models immediately
3. Continue training every 1 hour
4. Run until manually stopped (Ctrl+C)

### Option 2: Manual Training

Train a single stock:

```batch
train_single_stock.bat
```

Train all default stocks:

```batch
train_all_stocks.bat
```

### Option 3: Python Command Line

```python
# Train single model
from mlops.training_pipeline import MLOpsTrainingPipeline

pipeline = MLOpsTrainingPipeline()
pipeline.train_model('AAPL', epochs=50)
```

```python
# Batch training
pipeline.batch_train(
    tickers=['AAPL', 'TSLA', 'GOOGL'],
    epochs=50,
    batch_size=32
)
```

```python
# Start scheduler programmatically
from mlops.scheduler import SchedulerService

scheduler = SchedulerService(stocks=['AAPL', 'TSLA', 'GOOGL'])
scheduler.start(interval_hours=1)
```

## 📊 Model Registry Usage

### View Registered Models

```python
from mlops.registry import ModelRegistry

registry = ModelRegistry()

# List all models
all_models = registry.list_models()

# List models for specific ticker
aapl_models = registry.list_models(ticker='AAPL')

# Get best model
best_model = registry.get_best_model('AAPL')
print(f"Best model validation loss: {best_model['metrics']['val_loss']}")

# Get latest model
latest_model = registry.get_latest_model('AAPL')
print(f"Latest version: v{latest_model['version']}")

# Get statistics
stats = registry.get_model_stats('AAPL')
print(f"Total versions: {stats['total_versions']}")
print(f"Best validation loss: {stats['best_val_loss']}")
```

### Load Model in Production

```python
from tensorflow.keras.models import load_model
import pickle

# Get best model from registry
registry = ModelRegistry()
model_info = registry.get_best_model('AAPL')

# Load model
model = load_model(model_info['model_path'])

# Load scaler
with open(model_info['scaler_path'], 'rb') as f:
    scaler = pickle.load(f)

# Use for predictions
predictions = model.predict(scaled_data)
```

## ⚙️ Configuration

Edit `mlops/config.py` to customize:

```python
class MLOpsConfig:
    # Training settings
    DEFAULT_EPOCHS = 50
    DEFAULT_BATCH_SIZE = 32
    EARLY_STOPPING_PATIENCE = 10
    
    # Scheduler settings
    TRAINING_INTERVAL_HOURS = 1  # Change to 2, 4, 6, etc.
    DEFAULT_STOCKS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN']
    
    # Model architecture
    LOOKBACK_PERIOD = 60
    LSTM_UNITS = [50, 50]
    DROPOUT_RATE = 0.2
```

## 📈 Monitoring with TensorBoard

View training progress in TensorBoard:

```bash
tensorboard --logdir=mlops/logs/tensorboard
```

Then open: http://localhost:6006

## 🔄 Integration with Flask App

Update your [`app.py`](app.py ) to use MLOps models:

```python
from mlops.registry import ModelRegistry
from tensorflow.keras.models import load_model
import pickle

# Initialize registry
registry = ModelRegistry()

@app.route('/api/stock_data/<ticker>')
def get_stock_data(ticker):
    # Get best model from registry
    model_info = registry.get_best_model(ticker.upper())
    
    if not model_info:
        return jsonify({'error': f'No model available for {ticker}'}), 404
    
    # Load model and scaler
    model = load_model(model_info['model_path'])
    
    with open(model_info['scaler_path'], 'rb') as f:
        scaler = pickle.load(f)
    
    # Make predictions...
    # (rest of your prediction code)
```

## 📋 Training Pipeline Steps

The MLOps training pipeline executes:

1. **Data Ingestion** - Fetch latest stock data from Yahoo Finance
2. **Data Preprocessing** - Clean and prepare data
3. **Data Transformation** - Scale and reshape for LSTM
4. **Model Training** - Train with callbacks (EarlyStopping, ModelCheckpoint, TensorBoard)
5. **Model Evaluation** - Calculate comprehensive metrics
6. **Save & Register** - Save artifacts and register in model registry

## 🛠️ Troubleshooting

### Check Scheduler Status

```python
from mlops.scheduler import SchedulerService

scheduler = SchedulerService()
status = scheduler.get_status()
print(status)
```

### View Error Logs

```bash
type mlops\logs\training_errors.log
```

### List All Registered Models

```python
from mlops.registry import ModelRegistry

registry = ModelRegistry()
models = registry.list_models()

for model in models:
    print(f"{model['ticker']} v{model['version']}: "
          f"val_loss={model['metrics']['val_loss']:.6f}")
```

### Archive Old Models

```python
registry = ModelRegistry()

# Archive a specific model version
registry.archive_model('AAPL_v1_20251023_120000')

# Only active models will be used
active_models = registry.list_models(status='active')
```

## 📊 Performance Metrics

Each model tracks:
- **train_loss**: Training set loss
- **val_loss**: Validation set loss (used for model selection)
- **test_loss**: Test set loss
- **mse**: Mean Squared Error
- **rmse**: Root Mean Squared Error
- **mae**: Mean Absolute Error
- **epochs_trained**: Number of training epochs
- **train_samples**: Number of training samples

## 🎯 Best Practices

1. **Initial Setup**: Run `train_all_stocks.bat` once to create initial models
2. **Production**: Use `start_mlops_scheduler.bat` for continuous training
3. **Monitoring**: Check TensorBoard regularly to monitor training
4. **Model Selection**: Always use `get_best_model()` in production
5. **Error Handling**: Check `training_errors.log` if training fails

## 📝 Notes

- Models are automatically saved to `artifacts/` directory
- Registry metadata is stored in `mlops/model_registry/metadata.json`
- Scheduler continues even if individual stock training fails
- Best model is selected based on lowest validation loss
- Old model versions are kept for rollback capability

## 🔒 Security & Reliability

- ✅ Automatic error recovery
- ✅ Complete audit trail
- ✅ Version rollback capability
- ✅ Isolated training environment
- ✅ Safe production deployment

---

**VIONEX Finance MLOps System v1.0.0**
