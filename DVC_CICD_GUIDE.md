# 📚 Complete DVC & CI/CD Documentation

## 🎯 Table of Contents
1. [What is DVC?](#what-is-dvc)
2. [What is CI/CD?](#what-is-cicd)
3. [Project Structure](#project-structure)
4. [How DVC Works](#how-dvc-works)
5. [How CI/CD Pipeline Works](#how-cicd-pipeline-works)
6. [Deployment Process](#deployment-process)
7. [Setup Instructions](#setup-instructions)
8. [Common Commands](#common-commands)

---

## 🔍 What is DVC?

**DVC (Data Version Control)** is like **Git for machine learning models and datasets**.

### Why Do We Need DVC?

```
❌ PROBLEM:
- ML models are too large for Git (100MB+ files)
- Training data changes frequently
- Hard to track which model version performs best
- Can't reproduce experiments

✅ SOLUTION (DVC):
- Stores large files separately (Google Drive, S3, etc.)
- Tracks model versions like Git tracks code
- Creates reproducible ML pipelines
- Shares models across team
```

### Key DVC Concepts:

```
1. Pipeline Stages
   ├── Data Ingestion    → Fetch stock data
   ├── Data Transform    → Preprocess & scale
   ├── Model Training    → Train LSTM
   ├── Model Evaluation  → Test performance
   └── Model Registry    → Save best model

2. Remote Storage
   ├── Google Drive (free)
   ├── AWS S3 (scalable)
   ├── Azure Blob (enterprise)
   └── Local folder (testing)

3. Versioning
   ├── v1 → Accuracy: 85%
   ├── v2 → Accuracy: 88% ✅ (best)
   └── v3 → Accuracy: 86%
```

---

## 🚀 What is CI/CD?

**CI/CD** = **Continuous Integration** + **Continuous Deployment**

### CI/CD Workflow:

```
┌─────────────────────────────────────────────────────────┐
│  DEVELOPER WRITES CODE                                   │
│  ├── Fix bug in prediction logic                         │
│  ├── Add new feature                                     │
│  └── Update model architecture                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼ git push
┌─────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (Automated)                              │
│  ├── ✅ Run tests                                        │
│  ├── ✅ Check code quality                               │
│  ├── ✅ Train model                                      │
│  ├── ✅ Build Docker image                               │
│  └── ✅ Deploy to production                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼ automatically
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION SERVER                                       │
│  ├── New code is live                                    │
│  ├── Updated model serving predictions                   │
│  └── Users see improvements immediately                  │
└─────────────────────────────────────────────────────────┘
```

### Benefits:

- ⚡ **Speed**: Deploy in minutes, not days
- 🛡️ **Safety**: Tests run before deployment
- 🔄 **Automation**: No manual steps
- 📊 **Tracking**: Every change is logged

---

## 📁 Project Structure

```
vionex-finance/
│
├── .dvc/                      # DVC configuration
│   ├── config                 # Remote storage settings
│   └── .gitignore            # DVC cache files
│
├── .github/
│   └── workflows/            # CI/CD pipelines
│       ├── ci-cd.yml         # Main deployment pipeline
│       └── retrain.yml       # Scheduled retraining
│
├── dvc.yaml                  # ML pipeline definition
├── params.yaml               # Pipeline parameters
│
├── artifacts/                # Trained models (tracked by DVC)
│   ├── stock_lstm_model.h5  # Main LSTM model
│   ├── scaler.pkl           # Data scaler
│   └── *.json               # Metrics
│
├── mlops/
│   ├── training_pipeline.py  # Training automation
│   ├── evaluate_model.py     # Model evaluation
│   ├── registry.py           # Model versioning
│   └── scheduler.py          # Background training
│
├── src/
│   └── components/
│       ├── data_ingestion.py
│       ├── data_transformation.py
│       └── model_trainer.py
│
├── app.py                    # Flask application
├── Dockerfile               # Container definition
├── docker-compose.yml       # Multi-container setup
└── deploy.sh               # Deployment script
```

---

## ⚙️ How DVC Works (Step-by-Step)

### 1️⃣ **Initialize DVC**

```bash
# Install DVC
pip install dvc[gdrive]  # or dvc[s3], dvc[azure]

# Initialize DVC in project
dvc init

# Add remote storage (Google Drive)
dvc remote add -d myremote gdrive://1aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

**What happens:**
- Creates `.dvc/` folder
- Configures where to store large files
- Sets up Git integration

---

### 2️⃣ **Define ML Pipeline** (`dvc.yaml`)

```yaml
stages:
  # Stage 1: Get stock data
  data_ingestion:
    cmd: python -c "from src.components.data_ingestion import DataIngestion; di = DataIngestion(); di.initiate_data_ingestion('AAPL')"
    deps:
      - src/components/data_ingestion.py
    outs:
      - artifacts/raw_data.csv

  # Stage 2: Train model
  model_training:
    cmd: python -c "from src.components.model_trainer import ModelTrainer; mt = ModelTrainer(); mt.initiate_model_training()"
    deps:
      - src/components/model_trainer.py
      - artifacts/raw_data.csv
    outs:
      - artifacts/stock_lstm_model.h5
```

**What this does:**
- Defines pipeline steps
- Tracks dependencies (which files each stage needs)
- Tracks outputs (models, data files)

---

### 3️⃣ **Run Pipeline**

```bash
# Run entire pipeline
dvc repro
```

**What happens:**
```
Step 1: Check dependencies
  ├── Has data_ingestion.py changed? → Yes
  ├── Re-run data_ingestion stage
  └── Download fresh stock data

Step 2: Check next stage
  ├── Has raw_data.csv changed? → Yes (new data)
  ├── Re-run model_training stage
  └── Train new model

Step 3: Save results
  ├── Model saved: stock_lstm_model.h5
  └── Create .dvc file (metadata)
```

---

### 4️⃣ **Track Large Files**

```bash
# Track model with DVC
dvc add artifacts/stock_lstm_model.h5

# This creates: artifacts/stock_lstm_model.h5.dvc
```

**File content** (`.h5.dvc`):
```yaml
outs:
- md5: a3f5b8c9d2e1f4a6b7c8d9e0f1a2b3c4
  size: 125000000
  path: stock_lstm_model.h5
```

**What this means:**
- Git tracks `.h5.dvc` (tiny metadata file)
- DVC stores actual `.h5` (large model file)
- Model pushed to Google Drive/S3

---

### 5️⃣ **Push to Remote Storage**

```bash
# Push models to cloud storage
dvc push
```

**What happens:**
```
Uploading to Google Drive...
  ├── stock_lstm_model.h5 (125 MB)
  ├── scaler.pkl (2 MB)
  └── raw_data.csv (50 MB)

✅ All files uploaded!
```

---

### 6️⃣ **Collaborate with Team**

```bash
# Team member pulls latest code
git pull

# Download models from cloud
dvc pull
```

**Result:**
- Code synced via Git
- Models downloaded via DVC
- Everyone has same environment

---

## 🔄 How CI/CD Pipeline Works

### **Complete CI/CD Flow:**

```
┌──────────────────────────────────────────────────────────────────┐
│  1. TRIGGER (Any of these)                                        │
│     ├── Developer pushes code to GitHub                           │
│     ├── Pull request created                                      │
│     ├── Schedule (daily at 2 AM)                                  │
│     └── Manual trigger                                            │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. JOB 1: TEST & LINT (5 minutes)                                │
│                                                                    │
│     Step 1: Checkout code from GitHub                             │
│     Step 2: Setup Python 3.10                                     │
│     Step 3: Install dependencies                                  │
│     Step 4: Run code linter (flake8)                              │
│             └─► Checks for syntax errors                          │
│     Step 5: Run code formatter (black)                            │
│             └─► Ensures consistent formatting                     │
│     Step 6: Run unit tests (pytest)                               │
│             └─► Tests all functions                               │
│     Step 7: Generate coverage report                              │
│             └─► Shows which code is tested                        │
│                                                                    │
│     ✅ PASS → Continue to next job                                │
│     ❌ FAIL → Stop pipeline, notify developer                     │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. JOB 2: TRAIN ML MODELS (30 minutes)                           │
│                                                                    │
│     Step 1: Checkout code                                         │
│     Step 2: Setup Python                                          │
│     Step 3: Install dependencies + DVC                            │
│     Step 4: Configure DVC remote (Google Drive)                   │
│     Step 5: Pull existing models (dvc pull)                       │
│     Step 6: Run DVC pipeline (dvc repro)                          │
│             ├─► Fetch fresh stock data                            │
│             ├─► Preprocess data                                   │
│             ├─► Train LSTM model (50 epochs)                      │
│             └─► Evaluate model performance                        │
│     Step 7: Push models to cloud (dvc push)                       │
│     Step 8: Upload artifacts to GitHub                            │
│     Step 9: Generate metrics report                               │
│                                                                    │
│     Example Output:                                                │
│     ┌──────────────────────────────┐                              │
│     │ Model: AAPL v2.1             │                              │
│     │ RMSE: 2.34 (improved!)       │                              │
│     │ R²: 0.94                      │                              │
│     │ Training time: 28 mins       │                              │
│     └──────────────────────────────┘                              │
│                                                                    │
│     ✅ PASS → Continue to build                                   │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. JOB 3: BUILD DOCKER IMAGE (10 minutes)                        │
│                                                                    │
│     Step 1: Checkout code                                         │
│     Step 2: Download trained models (from Job 2)                  │
│     Step 3: Setup Docker Buildx                                   │
│     Step 4: Login to Docker Hub                                   │
│     Step 5: Build Docker image                                    │
│             └─► Package: app + models + dependencies              │
│     Step 6: Tag image                                             │
│             ├─► yourusername/vionex-predictor:latest              │
│             └─► yourusername/vionex-predictor:abc123 (commit)     │
│     Step 7: Push to Docker Hub                                    │
│                                                                    │
│     Docker Image Contents:                                         │
│     ├── Python 3.10                                               │
│     ├── Flask app                                                 │
│     ├── Trained models                                            │
│     ├── All dependencies                                          │
│     └── Gunicorn server                                           │
│                                                                    │
│     ✅ Image built and pushed                                     │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. JOB 4: DEPLOY TO PRODUCTION (5 minutes)                       │
│                                                                    │
│     Step 1: Checkout code                                         │
│     Step 2: Download models                                       │
│     Step 3: Choose deployment target                              │
│             ├─► Heroku                                            │
│             ├─► AWS EC2                                           │
│             ├─► Railway                                           │
│             └─► Docker                                            │
│                                                                    │
│     HEROKU DEPLOYMENT:                                             │
│     ├─► Login to Heroku with API key                              │
│     ├─► Create/update Heroku app                                  │
│     ├─► Set environment variables                                 │
│     ├─► Push code to Heroku                                       │
│     └─► Heroku builds and deploys automatically                   │
│                                                                    │
│     AWS EC2 DEPLOYMENT:                                            │
│     ├─► Connect via SSH                                           │
│     ├─► Upload files (rsync)                                      │
│     ├─► Install dependencies                                      │
│     └─► Restart application service                               │
│                                                                    │
│     ✅ Deployed successfully                                      │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. JOB 5: HEALTH CHECK (2 minutes)                               │
│                                                                    │
│     Step 1: Wait 60 seconds (app startup)                         │
│     Step 2: Check homepage                                        │
│             └─► curl https://your-app.herokuapp.com/              │
│     Step 3: Test API endpoint                                     │
│             └─► curl .../api/stock_data/AAPL                      │
│     Step 4: Verify response                                       │
│             └─► Check if "success": true                          │
│                                                                    │
│     Example Test:                                                  │
│     Request:  GET /api/stock_data/AAPL                            │
│     Response: {"success": true, "price": 186.45}                  │
│                                                                    │
│     ✅ Application is healthy!                                    │
│     ✅ API is working!                                            │
│                                                                    │
│     📧 Send success notification                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### **CI/CD Timeline Example:**

```
09:00:00 - Developer pushes code
09:00:15 - GitHub Actions triggered
09:00:30 - Job 1 starts (Testing)
09:05:30 - Job 1 complete ✅
09:05:45 - Job 2 starts (Training)
09:35:45 - Job 2 complete ✅ (Models trained)
09:36:00 - Job 3 starts (Docker build)
09:46:00 - Job 3 complete ✅ (Image pushed)
09:46:15 - Job 4 starts (Deployment)
09:51:15 - Job 4 complete ✅ (Live on Heroku!)
09:51:30 - Job 5 starts (Health check)
09:53:30 - Job 5 complete ✅
09:53:45 - 🎉 Pipeline success! Total time: 53 minutes
```

---

## 🚀 Deployment Process Explained

### **Option 1: Heroku Deployment**

```bash
# Automatic (via CI/CD)
git push origin main
# → GitHub Actions deploys automatically

# Manual
bash deploy.sh heroku production
```

**What happens:**
1. Code pushed to Heroku Git
2. Heroku detects `Procfile`
3. Installs dependencies
4. Starts Flask app with Gunicorn
5. App live at: `https://your-app.herokuapp.com`

**Procfile:**
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
worker: python mlops/scheduler.py
```

---

### **Option 2: Docker Deployment**

```bash
# Build and run locally
docker-compose up -d

# Or use deploy script
bash deploy.sh docker production
```

**What happens:**
1. Builds Docker image with app + models
2. Starts container on port 5000
3. Background worker for training
4. MLflow server on port 5001

**Access:**
- Main app: `http://localhost:5000`
- MLflow: `http://localhost:5001`

---

### **Option 3: AWS EC2 Deployment**

```bash
# Set environment variables
export EC2_HOST=ec2-123-45-67-89.compute-1.amazonaws.com
export EC2_USER=ubuntu

# Deploy
bash deploy.sh aws production
```

**What happens:**
1. Uploads code to EC2 via SSH
2. Installs dependencies on server
3. Restarts application service
4. App runs on EC2 instance

---

## 📖 Setup Instructions

### **1. Install DVC**

```bash
# For Google Drive storage
pip install dvc[gdrive]

# For AWS S3
pip install dvc[s3]

# For Azure
pip install dvc[azure]
```

### **2. Configure DVC Remote**

```bash
# Initialize DVC
dvc init

# Add Google Drive remote
dvc remote add -d myremote gdrive://YOUR_FOLDER_ID

# Or S3
dvc remote add -d myremote s3://my-bucket/dvc-store
dvc remote modify myremote region us-west-2

# Or local (testing)
dvc remote add -d myremote /tmp/dvc-storage
```

### **3. Configure GitHub Secrets**

Go to: `GitHub Repository → Settings → Secrets → Actions`

Add these secrets:

```
HEROKU_API_KEY          = your-heroku-api-key
HEROKU_APP_NAME         = your-app-name
HEROKU_EMAIL            = your@email.com

DOCKER_USERNAME         = your-dockerhub-username
DOCKER_PASSWORD         = your-dockerhub-password

AWS_ACCESS_KEY_ID       = your-aws-key
AWS_SECRET_ACCESS_KEY   = your-aws-secret
EC2_HOST                = ec2-xxx.compute.amazonaws.com
EC2_USER                = ubuntu
EC2_SSH_KEY             = -----BEGIN RSA PRIVATE KEY-----...

GDRIVE_CREDENTIALS_DATA = {"client_id": "...", "client_secret": "..."}
```

### **4. Test Locally**

```bash
# Run DVC pipeline
dvc repro

# Test app
python app.py

# Open browser
http://localhost:5000
```

### **5. Deploy**

```bash
# Push to GitHub
git add .
git commit -m "Setup DVC and CI/CD"
git push origin main

# GitHub Actions will automatically:
# ✅ Run tests
# ✅ Train models
# ✅ Build Docker image
# ✅ Deploy to production
```

---

## 🛠️ Common Commands

### **DVC Commands**

```bash
# Initialize DVC
dvc init

# Add file to DVC tracking
dvc add artifacts/stock_lstm_model.h5

# Run entire pipeline
dvc repro

# Run specific stage
dvc repro model_training

# Push models to remote
dvc push

# Pull models from remote
dvc pull

# Show metrics
dvc metrics show

# Compare experiments
dvc metrics diff

# Show pipeline DAG (visual)
dvc dag

# Check pipeline status
dvc status

# List tracked files
dvc list . -R
```

### **Git + DVC Workflow**

```bash
# 1. Make changes to code
vim src/components/model_trainer.py

# 2. Run pipeline
dvc repro

# 3. Commit DVC metadata
git add dvc.yaml dvc.lock
git add artifacts/*.dvc

# 4. Push models to cloud
dvc push

# 5. Push code to GitHub
git commit -m "Improved model accuracy"
git push origin main

# ✅ CI/CD automatically deploys!
```

### **Deployment Commands**

```bash
# Deploy to Heroku
bash deploy.sh heroku production

# Deploy to AWS
bash deploy.sh aws production

# Deploy to Railway
bash deploy.sh railway production

# Run with Docker
bash deploy.sh docker production

# Or use docker-compose
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f web  # View logs
docker-compose ps           # List containers
```

### **Docker Commands**

```bash
# Build image
docker build -t vionex-predictor .

# Run container
docker run -d -p 5000:5000 vionex-predictor

# View logs
docker logs -f vionex-predictor

# Stop container
docker stop vionex-predictor

# Remove container
docker rm vionex-predictor

# Push to Docker Hub
docker push yourusername/vionex-predictor:latest
```

---

## 🎓 How Everything Works Together

### **Complete Workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│  DEVELOPER'S MACHINE                                         │
│                                                               │
│  1. Write code                                               │
│  2. dvc repro (train model locally)                          │
│  3. dvc push (upload to Google Drive)                        │
│  4. git push (upload code to GitHub)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (Cloud CI/CD)                                │
│                                                               │
│  1. ✅ Run tests                                             │
│  2. 🤖 dvc pull (download existing models)                   │
│  3. 🚀 dvc repro (retrain with fresh data)                   │
│  4. 📤 dvc push (save new models)                            │
│  5. 🐋 Build Docker image                                    │
│  6. 🚀 Deploy to production                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION SERVER (Heroku/AWS/Railway)                      │
│                                                               │
│  ├─► Flask app running                                       │
│  ├─► Serving predictions via API                             │
│  ├─► Background worker retraining models                     │
│  └─► Users accessing dashboard                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Summary

### **What We Built:**

✅ **DVC Setup**
- Tracks large ML models
- Creates reproducible pipelines
- Stores models in cloud (Google Drive/S3)
- Enables team collaboration

✅ **CI/CD Pipeline**
- Automatically tests code
- Trains models on every push
- Builds Docker images
- Deploys to production
- Runs health checks

✅ **Deployment**
- Multiple options (Heroku, AWS, Docker)
- One-command deployment
- Automatic scaling
- Health monitoring

### **Key Benefits:**

🚀 **Speed**: Deploy in 50 minutes (fully automated)
🛡️ **Quality**: Tests catch bugs before production
📊 **Tracking**: Every model version is saved
🔄 **Reproducibility**: Anyone can recreate experiments
⚡ **Scalability**: Easy to add more stocks/features
🤝 **Collaboration**: Team members sync effortlessly

---

## 📞 Need Help?

Check these resources:
- DVC Docs: https://dvc.org/doc
- GitHub Actions: https://docs.github.com/actions
- Docker Docs: https://docs.docker.com
- Heroku Docs: https://devcenter.heroku.com

---

**🎊 Congratulations! Your ML project is now production-ready with automated deployment!**
