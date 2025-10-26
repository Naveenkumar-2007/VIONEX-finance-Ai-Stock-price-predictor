# GitHub Actions + Azure Deployment Setup

## ✅ What I've Done:

1. **Fixed Dependencies** - Updated `requirements.txt` to use TensorFlow versions compatible with Python 3.11+
2. **Created GitHub Actions Workflow** - Added `.github/workflows/azure-webapps-python.yml` for automated deployment
3. **Pushed to GitHub** - All changes are now in your repository

## 🔧 What You Need to Do:

### Step 1: Get Azure Publish Profile

1. Go to **Azure Portal**: https://portal.azure.com
2. Navigate to your App Service: **vionex-finance-ai-stock-price-predictor**
3. Click **"Get publish profile"** button at the top (download icon)
4. Save the downloaded file (it's an XML file)

### Step 2: Add GitHub Secret

1. Go to your GitHub repository: https://github.com/Naveenkumar-2007/VIONEX-finance-Ai-Stock-price-predictor
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Set:
   - **Name**: `AZUREAPPSERVICE_PUBLISHPROFILE`
   - **Value**: Open the downloaded publish profile XML file and paste its ENTIRE contents
6. Click **"Add secret"**

### Step 3: Configure Azure Environment Variables

You still need to add the API keys to Azure. Choose ONE method:

#### Method A: Azure Portal (Recommended - Visual)

1. Go to Azure Portal: https://portal.azure.com
2. Open your App Service: **vionex-finance-ai-stock-price-predictor**
3. Click **Configuration** (in the left menu under Settings)
4. Click **"+ New application setting"** for each:
   
   **First Setting:**
   - Name: `TWELVE_DATA_API_KEY`
   - Value: `fbbf800ba2694b4a8faf45c487de8342`
   
   **Second Setting:**
   - Name: `FINNHUB_API_KEY`
   - Value: `d3ueuhhr01qil4apoka0d3ueuhhr01qil4apokag`

5. Click **"Save"** at the top
6. Click **"Continue"** (app will restart)

#### Method B: Azure CLI (Command Line)

First, find your resource group:
```powershell
az webapp list --query "[?name=='vionex-finance-ai-stock-price-predictor'].{Name:name, ResourceGroup:resourceGroup}" --output table
```

Then run (replace `<YOUR_RESOURCE_GROUP>` with the actual name):
```powershell
az webapp config appsettings set `
  --name vionex-finance-ai-stock-price-predictor `
  --resource-group <YOUR_RESOURCE_GROUP> `
  --settings `
    TWELVE_DATA_API_KEY="fbbf800ba2694b4a8faf45c487de8342" `
    FINNHUB_API_KEY="d3ueuhhr01qil4apoka0d3ueuhhr01qil4apokag"

az webapp restart `
  --name vionex-finance-ai-stock-price-predictor `
  --resource-group <YOUR_RESOURCE_GROUP>
```

### Step 4: Trigger Deployment

Once you've added the GitHub secret, the workflow will automatically deploy when you push to `main`.

You can also manually trigger it:
1. Go to GitHub → Your Repository → **Actions** tab
2. Click on **"Deploy to Azure Web App"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

---

## 🎯 Verification

After deployment completes (check the Actions tab), visit:
https://vionex-finance-ai-stock-price-predictor-auggekghbghye0f4.centralindia-01.azurewebsites.net/

Test:
1. Search for "AAPL"
2. Verify Technical Chart appears with candlesticks and SMA lines
3. Check that P/E ratio displays correctly
4. Confirm news and sentiment load

---

## 📊 Monitoring Deployment

### GitHub Actions:
- Go to: https://github.com/Naveenkumar-2007/VIONEX-finance-Ai-Stock-price-predictor/actions
- Watch the build and deployment progress

### Azure Logs (if something goes wrong):
```powershell
# Stream live logs
az webapp log tail --name vionex-finance-ai-stock-price-predictor --resource-group <YOUR_RESOURCE_GROUP>

# View recent logs
az webapp log download --name vionex-finance-ai-stock-price-predictor --resource-group <YOUR_RESOURCE_GROUP>
```

---

## ⚠️ Important Notes

1. **Python Version**: The workflow uses Python 3.11 (compatible with latest TensorFlow)
2. **Environment Variables**: Must be set in Azure (not in GitHub - they're server-side secrets)
3. **First Deployment**: May take 5-10 minutes as it installs all dependencies
4. **Auto-Deploy**: Every push to `main` branch will trigger a new deployment

---

## 🆘 Troubleshooting

### If deployment fails:
1. Check GitHub Actions logs for errors
2. Verify the publish profile secret is correct
3. Make sure Azure App Service is running (not stopped)

### If app doesn't work after deployment:
1. Check Azure logs: `az webapp log tail ...`
2. Verify environment variables are set in Azure Configuration
3. Try manually restarting: Azure Portal → App Service → Restart

### If charts don't appear:
1. Confirm API keys are set in Azure Configuration
2. Check browser console for errors (F12)
3. Test API endpoints directly: `https://your-app.azurewebsites.net/api/stock_data/AAPL`
