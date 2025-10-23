"""
Model Registry - Version control and management for ML models
Tracks model versions, performance metrics, and deployment status
"""

import os
import json
import shutil
from datetime import datetime
from typing import Dict, List, Optional


class ModelRegistry:
    """
    Manages ML model versions, metadata, and lifecycle
    """
    
    def __init__(self, registry_path: str = 'mlops/model_registry'):
        """
        Initialize the model registry
        
        Args:
            registry_path: Directory to store model registry data
        """
        self.registry_path = registry_path
        self.metadata_file = os.path.join(registry_path, 'metadata.json')
        
        # Create registry directory
        os.makedirs(registry_path, exist_ok=True)
        
        # Load or initialize metadata
        self._initialize_metadata()
    
    def _initialize_metadata(self):
        """Initialize or load existing metadata"""
        if os.path.exists(self.metadata_file):
            self._load_metadata()
        else:
            self.metadata = {
                'models': [],
                'registry_version': '1.0.0',
                'created_at': datetime.now().isoformat()
            }
            self._save_metadata()
    
    def _load_metadata(self):
        """Load metadata from JSON file"""
        try:
            with open(self.metadata_file, 'r') as f:
                self.metadata = json.load(f)
        except Exception as e:
            print(f"⚠️ Error loading metadata: {e}")
            self._initialize_metadata()
    
    def _save_metadata(self):
        """Save metadata to JSON file"""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=4)
        except Exception as e:
            print(f"❌ Error saving metadata: {e}")
    
    def register_model(
        self, 
        ticker: str, 
        model_path: str, 
        metrics: Dict, 
        scaler_path: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Register a new trained model in the registry
        
        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL')
            model_path: Path to the trained model file
            metrics: Dictionary of model performance metrics
            scaler_path: Path to the data scaler file (optional)
            metadata: Additional metadata (optional)
        
        Returns:
            Dictionary containing registered model information
        """
        # Calculate version number
        existing_models = [m for m in self.metadata['models'] if m['ticker'] == ticker]
        version = len(existing_models) + 1
        
        # Create version-specific directory
        version_id = f"{ticker}_v{version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        version_dir = os.path.join(self.registry_path, version_id)
        os.makedirs(version_dir, exist_ok=True)
        
        # Copy model and scaler files
        model_filename = os.path.join(version_dir, 'model.h5')
        shutil.copy(model_path, model_filename)
        
        scaler_filename = None
        if scaler_path and os.path.exists(scaler_path):
            scaler_filename = os.path.join(version_dir, 'scaler.pkl')
            shutil.copy(scaler_path, scaler_filename)
        
        # Create model information
        model_info = {
            'ticker': ticker,
            'version': version,
            'version_id': version_id,
            'registered_at': datetime.now().isoformat(),
            'model_path': model_filename,
            'scaler_path': scaler_filename,
            'metrics': metrics,
            'status': 'active',
            'metadata': metadata or {}
        }
        
        # Add to registry
        self.metadata['models'].append(model_info)
        self._save_metadata()
        
        print(f"✅ Model registered: {ticker} v{version}")
        print(f"   📊 Validation Loss: {metrics.get('val_loss', 'N/A'):.6f}")
        print(f"   📁 Path: {version_dir}")
        
        return model_info
    
    def get_best_model(self, ticker: str) -> Optional[Dict]:
        """
        Get the best performing model for a specific ticker
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            Model information dictionary or None if no models found
        """
        active_models = [
            m for m in self.metadata['models'] 
            if m['ticker'] == ticker and m['status'] == 'active'
        ]
        
        if not active_models:
            return None
        
        # Return model with lowest validation loss
        best_model = min(
            active_models, 
            key=lambda x: x['metrics'].get('val_loss', float('inf'))
        )
        
        return best_model
    
    def get_latest_model(self, ticker: str) -> Optional[Dict]:
        """
        Get the most recently trained model for a specific ticker
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            Model information dictionary or None if no models found
        """
        active_models = [
            m for m in self.metadata['models'] 
            if m['ticker'] == ticker and m['status'] == 'active'
        ]
        
        if not active_models:
            return None
        
        return max(active_models, key=lambda x: x['version'])
    
    def list_models(self, ticker: Optional[str] = None, status: str = 'active') -> List[Dict]:
        """
        List all registered models
        
        Args:
            ticker: Filter by ticker symbol (optional)
            status: Filter by status ('active', 'archived', 'deprecated')
        
        Returns:
            List of model information dictionaries
        """
        models = self.metadata['models']
        
        if ticker:
            models = [m for m in models if m['ticker'] == ticker]
        
        if status:
            models = [m for m in models if m['status'] == status]
        
        return models
    
    def archive_model(self, version_id: str):
        """
        Archive a model (mark as inactive but keep data)
        
        Args:
            version_id: Unique version identifier
        """
        for model in self.metadata['models']:
            if model['version_id'] == version_id:
                model['status'] = 'archived'
                model['archived_at'] = datetime.now().isoformat()
                self._save_metadata()
                print(f"📦 Model archived: {version_id}")
                return
        
        print(f"⚠️ Model not found: {version_id}")
    
    def get_model_stats(self, ticker: str) -> Dict:
        """
        Get statistics for all models of a specific ticker
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            Dictionary containing model statistics
        """
        models = [m for m in self.metadata['models'] if m['ticker'] == ticker]
        
        if not models:
            return {'ticker': ticker, 'total_versions': 0}
        
        active_models = [m for m in models if m['status'] == 'active']
        
        val_losses = [m['metrics'].get('val_loss', float('inf')) for m in active_models]
        
        return {
            'ticker': ticker,
            'total_versions': len(models),
            'active_versions': len(active_models),
            'best_val_loss': min(val_losses) if val_losses else None,
            'avg_val_loss': sum(val_losses) / len(val_losses) if val_losses else None,
            'latest_version': max([m['version'] for m in models])
        }


if __name__ == "__main__":
    # Example usage
    registry = ModelRegistry()
    
    # Print all registered models
    models = registry.list_models()
    print(f"\n📋 Total Models: {len(models)}")
    
    for model in models:
        print(f"\n{model['ticker']} v{model['version']}")
        print(f"  Status: {model['status']}")
        print(f"  Val Loss: {model['metrics'].get('val_loss', 'N/A')}")
