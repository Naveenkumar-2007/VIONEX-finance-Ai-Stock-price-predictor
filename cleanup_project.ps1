# VIONEX Finance - Automated Cleanup for Cloud Deployment
# This script removes all unused files identified in the analysis

Write-Host "🧹 Starting VIONEX Finance Project Cleanup..." -ForegroundColor Cyan
Write-Host ""

$rootPath = "c:\Users\navee\Cisco Packet Tracer 8.2.2\saves\sell"
Set-Location $rootPath

$deletedCount = 0
$failedCount = 0

function Remove-FileIfExists {
    param($filePath)
    
    if (Test-Path $filePath) {
        try {
            Remove-Item $filePath -Force
            Write-Host "✅ Deleted: $filePath" -ForegroundColor Green
            $script:deletedCount++
        } catch {
            Write-Host "❌ Failed: $filePath - $($_.Exception.Message)" -ForegroundColor Red
            $script:failedCount++
        }
    } else {
        Write-Host "⚠️  Not found: $filePath" -ForegroundColor Yellow
    }
}

Write-Host "📋 Phase 1: Removing Duplicate Templates..." -ForegroundColor Magenta
Remove-FileIfExists "templates\index.html"
Remove-FileIfExists "templates\home.html"

Write-Host ""
Write-Host "📋 Phase 2: Removing Unused Static Files..." -ForegroundColor Magenta
Remove-FileIfExists "static\styles.css"
Remove-FileIfExists "static\script.js"

Write-Host ""
Write-Host "📋 Phase 3: Removing Test Scripts..." -ForegroundColor Magenta
Remove-FileIfExists "test_prediction.py"
Remove-FileIfExists "test_detailed_prediction.py"
Remove-FileIfExists "simple_prediction.py"
Remove-FileIfExists "auto_retrain.py"

Write-Host ""
Write-Host "📋 Phase 4: Removing Old Pipeline Files..." -ForegroundColor Magenta
Remove-FileIfExists "src\pipeline\predict_pipeline_old.py"
Remove-FileIfExists "src\pipeline\predict_pipeline.py"

Write-Host ""
Write-Host "📋 Phase 5: Removing Windows Batch Files..." -ForegroundColor Magenta
Remove-FileIfExists "start_app.bat"
Remove-FileIfExists "start_scheduler.bat"
Remove-FileIfExists "start_mlops_scheduler.bat"
Remove-FileIfExists "train_single_stock.bat"
Remove-FileIfExists "train_all_stocks.bat"
Remove-FileIfExists "test_mlops.bat"
Remove-FileIfExists "view_mlops_status.bat"

Write-Host ""
Write-Host "📋 Phase 6: Removing Duplicate Documentation..." -ForegroundColor Magenta
Remove-FileIfExists "QUICK_START.md"
Remove-FileIfExists "IMPLEMENTATION_SUMMARY.md"
Remove-FileIfExists "DASHBOARD_README.md"
Remove-FileIfExists "MODEL_ACCURACY_GUIDE.md"
Remove-FileIfExists "FEATURES.md"
Remove-FileIfExists "TROUBLESHOOTING.md"

Write-Host ""
Write-Host "📋 Phase 7: Removing DVC Config..." -ForegroundColor Magenta
Remove-FileIfExists "dvc.yml"

Write-Host ""
Write-Host "📋 Phase 8: Cleaning Temporary Artifacts..." -ForegroundColor Magenta
Remove-FileIfExists "artifacts\raw_stock_data.csv"
Remove-FileIfExists "artifacts\processed_train.npy"
Remove-FileIfExists "artifacts\processed_test.npy"
Remove-FileIfExists "artifacts\train_stock_data.csv"
Remove-FileIfExists "artifacts\test_stock_data.csv"
Remove-FileIfExists "artifacts\model_metrics.json"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Files Deleted: $deletedCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $failedCount" -ForegroundColor Red
Write-Host ""
Write-Host "🚀 Your project is now ready for cloud deployment!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Review CLEANUP_ANALYSIS.md for details"
Write-Host "   2. Test the application: python app.py"
Write-Host "   3. Commit changes to git"
Write-Host "   4. Deploy to cloud (Heroku, AWS, etc.)"
Write-Host ""
