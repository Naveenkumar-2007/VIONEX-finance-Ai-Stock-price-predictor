# 🚀 Quick Start Guide - DVC & CI/CD

## ⚡ 5-Minute Setup

### Step 1: Install DVC
```bash
pip install dvc[gdrive]
```

### Step 2: Initialize DVC
```bash
dvc init
dvc remote add -d myremote gdrive://YOUR_GOOGLE_DRIVE_FOLDER_ID
```

### Step 3: Configure GitHub Secrets
Add in `GitHub → Settings → Secrets`:
- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `HEROKU_EMAIL`

### Step 4: Push to GitHub
```bash
git add .
git commit -m "Setup DVC and CI/CD"
git push origin main
```

### Step 5: Watch Magic Happen! ✨
GitHub Actions will automatically:
- ✅ Test your code
- ✅ Train models
- ✅ Deploy to Heroku

---

## 📝 Daily Workflow

```bash
# 1. Pull latest code and models
git pull
dvc pull

# 2. Make changes
vim src/components/model_trainer.py

# 3. Test locally
python app.py

# 4. Run DVC pipeline
dvc repro

# 5. Push models to cloud
dvc push

# 6. Commit and push
git add .
git commit -m "Improved model"
git push

# ✅ CI/CD deploys automatically!
```

---

## 🔑 Key Commands

### DVC Commands
```bash
dvc repro              # Run pipeline
dvc push              # Upload models
dvc pull              # Download models
dvc metrics show      # Show metrics
dvc dag               # View pipeline graph
```

### Deployment Commands
```bash
bash deploy.sh heroku    # Deploy to Heroku
bash deploy.sh docker    # Run with Docker
docker-compose up -d     # Start all services
```

### Check Status
```bash
# View CI/CD status
# Go to: GitHub → Actions tab

# Check deployment
curl https://your-app.herokuapp.com/api/stock_data/AAPL
```

---

## 🆘 Troubleshooting

### DVC Not Working?
```bash
# Re-authenticate with Google Drive
dvc push
# Follow OAuth link in terminal
```

### CI/CD Failing?
1. Check GitHub Actions tab
2. View error logs
3. Fix issue
4. Push again

### App Not Loading?
```bash
# Check Heroku logs
heroku logs --tail --app your-app-name

# Restart app
heroku restart --app your-app-name
```

---

## 📊 Project Structure

```
Your Project/
├── .dvc/              # DVC config
├── .github/workflows/ # CI/CD pipelines
├── artifacts/         # Models (tracked by DVC)
├── mlops/            # Training automation
├── src/              # ML components
├── app.py            # Flask app
├── dvc.yaml          # Pipeline definition
└── deploy.sh         # Deployment script
```

---

## 🎯 What Each File Does

| File | Purpose |
|------|---------|
| `dvc.yaml` | Defines ML pipeline stages |
| `params.yaml` | Pipeline parameters |
| `.dvc/config` | DVC remote storage settings |
| `.github/workflows/ci-cd.yml` | Automated deployment |
| `deploy.sh` | Manual deployment script |
| `Dockerfile` | Container definition |
| `docker-compose.yml` | Multi-service setup |

---

## ✅ Checklist

Before deploying, ensure:
- [x] DVC initialized
- [x] Google Drive connected
- [x] GitHub secrets configured
- [x] Model trained (`artifacts/stock_lstm_model.h5` exists)
- [x] Tests passing (`pytest mlops/test_mlops.py`)
- [x] Git repository pushed to GitHub

---

## 🔗 Useful Links

- **Your App**: https://your-app-name.herokuapp.com
- **GitHub Actions**: https://github.com/Naveenkumar-2007/VIONEX-finance-Ai-Stock-price-predictor/actions
- **DVC Docs**: https://dvc.org/doc
- **Full Guide**: See `DVC_CICD_GUIDE.md`

---

**Need detailed explanation? Check `DVC_CICD_GUIDE.md` for complete documentation!**
