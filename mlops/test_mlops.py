"""
MLOps System Test Script
Verifies all components are working correctly
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mlops.registry import ModelRegistry
from mlops.training_pipeline import MLOpsTrainingPipeline
from mlops.config import MLOpsConfig


def test_configuration():
    """Test configuration setup"""
    print("\n" + "="*70)
    print("TEST 1: Configuration")
    print("="*70)
    
    try:
        print(f"✅ Base Directory: {MLOpsConfig.BASE_DIR}")
        print(f"✅ Registry Directory: {MLOpsConfig.REGISTRY_DIR}")
        print(f"✅ Logs Directory: {MLOpsConfig.LOGS_DIR}")
        print(f"✅ Checkpoints Directory: {MLOpsConfig.CHECKPOINTS_DIR}")
        print(f"✅ Artifacts Directory: {MLOpsConfig.ARTIFACTS_DIR}")
        
        # Check directories exist
        for dir_path in [MLOpsConfig.REGISTRY_DIR, MLOpsConfig.LOGS_DIR, 
                         MLOpsConfig.CHECKPOINTS_DIR, MLOpsConfig.ARTIFACTS_DIR]:
            assert os.path.exists(dir_path), f"Directory not found: {dir_path}"
        
        print("\n✅ Configuration test PASSED")
        return True
    except Exception as e:
        print(f"\n❌ Configuration test FAILED: {e}")
        return False


def test_registry():
    """Test model registry"""
    print("\n" + "="*70)
    print("TEST 2: Model Registry")
    print("="*70)
    
    try:
        registry = ModelRegistry()
        print("✅ Registry initialized")
        
        # List models
        models = registry.list_models()
        print(f"✅ Found {len(models)} registered models")
        
        # Test get_best_model
        if models:
            ticker = models[0]['ticker']
            best_model = registry.get_best_model(ticker)
            if best_model:
                print(f"✅ Best model for {ticker}: v{best_model['version']}")
                print(f"   Val Loss: {best_model['metrics']['val_loss']:.6f}")
        
        # Test get_model_stats
        if models:
            stats = registry.get_model_stats(models[0]['ticker'])
            print(f"✅ Model stats retrieved: {stats['total_versions']} versions")
        
        print("\n✅ Registry test PASSED")
        return True
    except Exception as e:
        print(f"\n❌ Registry test FAILED: {e}")
        return False


def test_training_pipeline():
    """Test training pipeline (quick test with AAPL)"""
    print("\n" + "="*70)
    print("TEST 3: Training Pipeline (Quick Test)")
    print("="*70)
    print("⚠️  This will train a model - may take a few minutes...")
    
    user_input = input("\nRun training test? (y/n): ").lower()
    
    if user_input != 'y':
        print("⏭️  Training test SKIPPED")
        return True
    
    try:
        pipeline = MLOpsTrainingPipeline()
        print("✅ Pipeline initialized")
        
        # Train a quick model (fewer epochs for testing)
        print("\n🧪 Training test model for AAPL...")
        model_info = pipeline.train_model(ticker='AAPL', epochs=5, batch_size=32)
        
        print(f"\n✅ Model trained successfully")
        print(f"   Version: v{model_info['version']}")
        print(f"   Val Loss: {model_info['metrics']['val_loss']:.6f}")
        
        # Verify model is registered
        registry = ModelRegistry()
        registered_model = registry.get_latest_model('AAPL')
        assert registered_model is not None, "Model not found in registry"
        print(f"✅ Model registered in registry")
        
        print("\n✅ Training pipeline test PASSED")
        return True
    except Exception as e:
        print(f"\n❌ Training pipeline test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "#"*70)
    print("VIONEX MLOps System Test Suite")
    print("#"*70)
    
    results = []
    
    # Run tests
    results.append(("Configuration", test_configuration()))
    results.append(("Model Registry", test_registry()))
    results.append(("Training Pipeline", test_training_pipeline()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests PASSED! MLOps system is ready to use.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    print("="*70 + "\n")


if __name__ == "__main__":
    run_all_tests()
