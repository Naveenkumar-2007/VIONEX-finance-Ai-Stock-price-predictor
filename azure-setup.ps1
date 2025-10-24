# Azure Deployment Setup Script
# Run this ONCE after deploying to Azure to configure environment variables

Write-Host "="*60 -ForegroundColor Cyan
Write-Host "Azure App Configuration - Twelve Data API" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Cyan

$resourceGroup = "stock"
$appName = "VIONEX-finance-Ai-Stock-price-predictor"
$apiKey = "4a46541183144fbdad78a5d3ac844d87"

Write-Host "`n🔧 Setting Twelve Data API key in Azure App Settings..." -ForegroundColor Cyan

az webapp config appsettings set `
    --resource-group $resourceGroup `
    --name $appName `
    --settings TWELVE_DATA_API_KEY=$apiKey

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ API key configured successfully!" -ForegroundColor Green
    Write-Host "`nℹ️  Restarting app to apply changes..." -ForegroundColor Yellow
    
    az webapp restart --resource-group $resourceGroup --name $appName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ App restarted successfully!" -ForegroundColor Green
        Write-Host "`n🎉 Your app is now configured to use Twelve Data API!" -ForegroundColor Green
        Write-Host "`n📊 API Limits:" -ForegroundColor Cyan
        Write-Host "   - Free tier: 800 requests/day" -ForegroundColor White
        Write-Host "   - More than enough for testing and small apps" -ForegroundColor White
        Write-Host "`n🌐 Your App URL:" -ForegroundColor Cyan
        Write-Host "   https://vionex-finance-ai-stock-price-predictor-auggekghbghye0f4.centralindia-01.azurewebsites.net" -ForegroundColor White
    } else {
        Write-Host "`n❌ Failed to restart app" -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ Failed to set API key" -ForegroundColor Red
}

Write-Host "`n="*60 -ForegroundColor Cyan
