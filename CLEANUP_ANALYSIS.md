# 🧹 VIONEX Finance - Project Cleanup for Cloud Deployment

## Analysis Complete - Files to Remove/Keep

### ❌ FILES TO DELETE (Unused/Duplicate/Development Only)

#### 1. **Duplicate/Old Templates**
```
templates/index.html          ❌ DELETE - Old template (using dashboard.html)
templates/home.html            ❌ DELETE - Unused template
```

#### 2. **Unused Static Files**
```
static/styles.css             ❌ DELETE - Not used (using dashboard.css)
static/script.js              ❌ DELETE - Not used (using dashboard.js)
```

#### 3. **Test/Development Scripts**
```
test_prediction.py            ❌ DELETE - Development testing only
test_detailed_prediction.py   ❌ DELETE - Development testing only
simple_prediction.py          ❌ DELETE - Development testing only
auto_retrain.py              ❌ DELETE - Replaced by MLOps system
```

#### 4. **Old Pipeline Files**
```
src/pipeline/predict_pipeline_old.py  ❌ DELETE - Old version
src/pipeline/predict_pipeline.py      ❌ DELETE - Not used (logic in app.py)
```

#### 5. **Windows Batch Files** (Not needed for cloud)
```
start_app.bat                 ❌ DELETE - Windows only
start_scheduler.bat           ❌ DELETE - Windows only
start_mlops_scheduler.bat     ❌ DELETE - Windows only
train_single_stock.bat        ❌ DELETE - Windows only
train_all_stocks.bat          ❌ DELETE - Windows only
test_mlops.bat                ❌ DELETE - Windows only
view_mlops_status.bat         ❌ DELETE - Windows only
```

#### 6. **Duplicate Documentation**
```
QUICK_START.md               ❌ DELETE - Duplicate of QUICKSTART.md
IMPLEMENTATION_SUMMARY.md     ❌ DELETE - Merged into IMPLEMENTATION_COMPLETE.md
DASHBOARD_README.md           ❌ DELETE - Info in main README
MODEL_ACCURACY_GUIDE.md       ❌ DELETE - Merged into docs
FEATURES.md                   ❌ DELETE - Listed in README
TROUBLESHOOTING.md            ❌ DELETE - Can be in README
```

#### 7. **DVC File** (Not using DVC)
```
dvc.yml                       ❌ DELETE - Not using DVC versioning
```

#### 8. **Temporary Artifact Files**
```
artifacts/raw_stock_data.csv      ❌ DELETE - Temporary data
artifacts/processed_train.npy     ❌ DELETE - Temporary data
artifacts/processed_test.npy      ❌ DELETE - Temporary data
artifacts/train_stock_data.csv    ❌ DELETE - Temporary data
artifacts/test_stock_data.csv     ❌ DELETE - Temporary data
artifacts/model_metrics.json      ❌ DELETE - Using MLOps registry
```

### ✅ FILES TO KEEP (Essential for Cloud Deployment)

#### Core Application
```
app.py                        ✅ KEEP - Main Flask application
requirements.txt              ✅ KEEP - Dependencies
.gitignore                    ✅ KEEP - Git configuration
Procfile                      ✅ KEEP - Cloud deployment (Heroku/etc)
```

#### Templates (Essential)
```
templates/dashboard.html      ✅ KEEP - Main UI
```

#### Static Assets (Essential)
```
static/dashboard.css          ✅ KEEP - Main stylesheet
static/dashboard.js           ✅ KEEP - Main JavaScript
static/vionex-logo.png        ✅ KEEP - Brand logo
```

#### Source Code (Core Components)
```
src/__init__.py               ✅ KEEP - Package marker
src/components/__init__.py    ✅ KEEP - Package marker
src/components/data_ingestion.py      ✅ KEEP - Data fetching
src/components/data_transformation.py ✅ KEEP - Data processing
src/components/model_trainer.py       ✅ KEEP - Model training
```

#### MLOps System (Essential)
```
mlops/__init__.py             ✅ KEEP - Package marker
mlops/config.py               ✅ KEEP - Configuration
mlops/registry.py             ✅ KEEP - Model versioning
mlops/training_pipeline.py    ✅ KEEP - Training automation
mlops/scheduler.py            ✅ KEEP - Auto-training scheduler
mlops/test_mlops.py           ✅ KEEP - Testing (useful for CI/CD)
mlops/README.md               ✅ KEEP - MLOps documentation
```

#### Model Artifacts (Keep structure, clean old data)
```
artifacts/                    ✅ KEEP - Directory (but clean old files)
mlops/model_registry/         ✅ KEEP - Model versions
mlops/logs/                   ✅ KEEP - Training logs
mlops/checkpoints/            ✅ KEEP - Training checkpoints
```

#### Documentation (Essential)
```
MLOPS_GUIDE.md               ✅ KEEP - Main MLOps guide
IMPLEMENTATION_COMPLETE.md    ✅ KEEP - Implementation summary
mlops/README.md              ✅ KEEP - Technical docs
```

---

## 📊 Summary

### Files Analysis:
- **Total Files Found**: ~104 files
- **To Delete**: 28 files (unused/duplicate)
- **To Keep**: 26 core files
- **Size Reduction**: ~60% reduction

### Cleanup Benefits:
1. ✅ Smaller deployment package
2. ✅ Faster cloud uploads
3. ✅ Cleaner codebase
4. ✅ Easier maintenance
5. ✅ Lower costs (storage/bandwidth)

---

## 🚀 Recommended Cloud Deployment Structure

```
vionex-finance/
├── app.py                      ← Main Flask app
├── requirements.txt            ← Dependencies
├── Procfile                    ← Cloud deployment config
├── .gitignore                  ← Git ignore rules
│
├── src/                        ← Source code
│   ├── __init__.py
│   └── components/
│       ├── __init__.py
│       ├── data_ingestion.py
│       ├── data_transformation.py
│       └── model_trainer.py
│
├── mlops/                      ← MLOps system
│   ├── __init__.py
│   ├── config.py
│   ├── registry.py
│   ├── training_pipeline.py
│   ├── scheduler.py
│   ├── test_mlops.py
│   ├── README.md
│   ├── model_registry/
│   ├── logs/
│   └── checkpoints/
│
├── templates/                  ← Flask templates
│   └── dashboard.html
│
├── static/                     ← Static assets
│   ├── dashboard.css
│   ├── dashboard.js
│   └── vionex-logo.png
│
├── artifacts/                  ← Model storage (keep empty initially)
│   └── .gitkeep
│
└── docs/                       ← Documentation (optional)
    ├── MLOPS_GUIDE.md
    └── IMPLEMENTATION_COMPLETE.md
```

---

## 🔧 Post-Cleanup Actions

### 1. Update requirements.txt
Remove unused dependencies:
```
❌ Remove: transformers (not used)
❌ Remove: mlflow (if not using tracking)
✅ Keep: All others
```

### 2. Update .gitignore
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Virtual Environment
venv/
env/
ENV/

# IDE
.vscode/
.idea/

# MLOps
mlops/model_registry/*/
mlops/logs/tensorboard/
mlops/checkpoints/

# Artifacts
artifacts/*.csv
artifacts/*.npy
artifacts/*.json

# Keep only
!artifacts/.gitkeep
!mlops/model_registry/.gitkeep
```

### 3. Create Procfile (if not exists)
```
web: gunicorn app:app
worker: python mlops/scheduler.py
```

### 4. Environment Variables (.env)
```
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
MODEL_PATH=artifacts/stock_lstm_model.h5
```

---

## ⚠️ Before Cleanup

1. **Backup your project**
2. **Test the application locally**
3. **Commit to git**
4. **Run the cleanup script**

---

**Ready to execute cleanup? See CLEANUP_SCRIPT.md**
