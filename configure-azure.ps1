# Azure Configuration Script for VIONEX Finance AI Stock Predictor
# Run this script to configure environment variables in Azure App Service

Write-Host "=== Azure App Service Configuration ===" -ForegroundColor Cyan
Write-Host ""

# App Service Details
$webAppName = "vionex-finance-ai-stock-price-predictor"

# Step 1: Find the resource group
Write-Host "Step 1: Finding resource group..." -ForegroundColor Yellow
az webapp list --query "[?name=='$webAppName'].{Name:name, ResourceGroup:resourceGroup}" --output table

Write-Host ""
Write-Host "Please enter your Resource Group name from the table above:" -ForegroundColor Green
$resourceGroup = Read-Host "Resource Group"

if ([string]::IsNullOrWhiteSpace($resourceGroup)) {
    Write-Host "ERROR: Resource group name is required!" -ForegroundColor Red
    exit 1
}

# Step 2: Set environment variables
Write-Host ""
Write-Host "Step 2: Setting API keys as environment variables..." -ForegroundColor Yellow

$settings = @{
    "TWELVE_DATA_API_KEY" = "fbbf800ba2694b4a8faf45c487de8342"
    "FINNHUB_API_KEY" = "d3ueuhhr01qil4apoka0d3ueuhhr01qil4apokag"
}

# Convert to Azure CLI format
$settingsString = ""
foreach ($key in $settings.Keys) {
    $settingsString += "$key=`"$($settings[$key])`" "
}

Write-Host "Executing: az webapp config appsettings set..." -ForegroundColor Gray
$command = "az webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings $settingsString"
Invoke-Expression $command

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! API keys configured successfully." -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 3: Restarting web app to apply changes..." -ForegroundColor Yellow
    az webapp restart --name $webAppName --resource-group $resourceGroup
    
    Write-Host ""
    Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "Your app is now available at:" -ForegroundColor Cyan
    Write-Host "https://$webAppName.centralindia-01.azurewebsites.net/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to configure settings. Please check your Azure CLI authentication." -ForegroundColor Red
    Write-Host "Run 'az login' to authenticate first." -ForegroundColor Yellow
}
