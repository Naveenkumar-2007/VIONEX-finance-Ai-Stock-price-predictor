"""
MLOps Training Pipeline - Automated model training with monitoring
Handles end-to-end model training with logging, versioning, and registration
"""

import os
import sys
from datetime import datetime
from typing import Dict, Tuple, Optional
import numpy as np
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, TensorBoard
import pickle

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.components.data_ingestion import DataIngestion
from src.components.data_transformation import DataTransformation
from src.components.model_trainer import ModelTrainer
from mlops.registry import ModelRegistry


class MLOpsTrainingPipeline:
    """
    Complete MLOps training pipeline with automated model management
    """
    
    def __init__(self, registry_path: str = 'mlops/model_registry'):
        """
        Initialize the MLOps training pipeline
        
        Args:
            registry_path: Path to model registry directory
        """
        self.registry = ModelRegistry(registry_path)
        self.logs_dir = 'mlops/logs'
        self.checkpoints_dir = 'mlops/checkpoints'
        self.artifacts_dir = 'artifacts'
        
        # Create directories
        os.makedirs(self.logs_dir, exist_ok=True)
        os.makedirs(self.checkpoints_dir, exist_ok=True)
        os.makedirs(self.artifacts_dir, exist_ok=True)
    
    def train_model(
        self, 
        ticker: str = 'AAPL', 
        epochs: int = 50, 
        batch_size: int = 32,
        validation_split: float = 0.2
    ) -> Dict:
        """
        Execute complete training pipeline for a stock ticker
        
        Args:
            ticker: Stock ticker symbol
            epochs: Number of training epochs
            batch_size: Batch size for training
            validation_split: Validation data split ratio
        
        Returns:
            Dictionary containing model information and metrics
        """
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        print(f"\n{'='*70}")
        print(f"🤖 VIONEX MLOps Training Pipeline")
        print(f"{'='*70}")
        print(f"📊 Ticker: {ticker}")
        print(f"⏰ Started: {timestamp}")
        print(f"{'='*70}\n")
        
        try:
            # Step 1: Data Ingestion
            print("📥 Step 1/6: Data Ingestion")
            print("-" * 70)
            raw_data = self._ingest_data(ticker)
            print(f"✅ Fetched {len(raw_data)} data points\n")
            
            # Step 2: Data Preprocessing
            print("🔧 Step 2/6: Data Preprocessing")
            print("-" * 70)
            train_data, test_data = self._preprocess_data(raw_data)
            print(f"✅ Train: {len(train_data)} | Test: {len(test_data)}\n")
            
            # Step 3: Data Transformation
            print("⚙️ Step 3/6: Data Transformation")
            print("-" * 70)
            X_train, y_train, X_test, y_test, scaler = self._transform_data(
                train_data, test_data
            )
            print(f"✅ X_train: {X_train.shape} | y_train: {y_train.shape}\n")
            
            # Step 4: Model Training
            print("🧠 Step 4/6: Model Training")
            print("-" * 70)
            model, history = self._train_model(
                ticker, X_train, y_train, X_test, y_test,
                epochs, batch_size
            )
            print(f"✅ Training completed in {len(history.history['loss'])} epochs\n")
            
            # Step 5: Model Evaluation
            print("📊 Step 5/6: Model Evaluation")
            print("-" * 70)
            metrics = self._evaluate_model(model, history, X_test, y_test, len(train_data))
            self._print_metrics(metrics)
            print()
            
            # Step 6: Save & Register
            print("💾 Step 6/6: Save & Register Model")
            print("-" * 70)
            model_info = self._save_and_register(
                ticker, model, scaler, metrics
            )
            print()
            
            # Success summary
            print(f"{'='*70}")
            print(f"✅ TRAINING COMPLETED SUCCESSFULLY")
            print(f"{'='*70}")
            print(f"📊 Ticker: {ticker}")
            print(f"🎯 Version: v{model_info['version']}")
            print(f"📉 Validation Loss: {metrics['val_loss']:.6f}")
            print(f"⏰ Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*70}\n")
            
            return model_info
            
        except Exception as e:
            print(f"\n{'='*70}")
            print(f"❌ TRAINING FAILED")
            print(f"{'='*70}")
            print(f"Error: {str(e)}")
            print(f"{'='*70}\n")
            
            self._log_error(ticker, str(e))
            raise
    
    def _ingest_data(self, ticker: str):
        """Ingest stock data from Yahoo Finance"""
        data_ingestion = DataIngestion(ticker=ticker)
        raw_data = data_ingestion.fetch_data()
        
        if raw_data.empty:
            raise ValueError(f"No data fetched for {ticker}")
        
        return raw_data
    
    def _preprocess_data(self, raw_data):
        """Preprocess and split data"""
        data_ingestion = DataIngestion()
        processed_data = data_ingestion.preprocess(raw_data)
        train_data, test_data = data_ingestion.split_data(processed_data)
        
        return train_data, test_data
    
    def _transform_data(self, train_data, test_data):
        """Transform data for LSTM model"""
        data_transformation = DataTransformation()
        X_train, y_train, X_test, y_test, scaler = data_transformation.transform(
            train_data, test_data
        )
        
        return X_train, y_train, X_test, y_test, scaler
    
    def _train_model(
        self, 
        ticker: str, 
        X_train, 
        y_train, 
        X_test, 
        y_test, 
        epochs: int, 
        batch_size: int
    ):
        """Train LSTM model with callbacks"""
        # Create callbacks
        checkpoint_path = os.path.join(
            self.checkpoints_dir,
            f"{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.h5"
        )
        
        tensorboard_log_dir = os.path.join(
            self.logs_dir,
            'tensorboard',
            f"{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )
        
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                checkpoint_path,
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            TensorBoard(
                log_dir=tensorboard_log_dir,
                histogram_freq=1
            )
        ]
        
        # Train model
        model_trainer = ModelTrainer()
        model, history = model_trainer.train_model(
            X_train, y_train, X_test, y_test,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks
        )
        
        return model, history
    
    def _evaluate_model(self, model, history, X_test, y_test, train_samples: int) -> Dict:
        """Evaluate model and collect metrics"""
        train_loss = float(history.history['loss'][-1])
        val_loss = float(history.history['val_loss'][-1])
        test_loss = float(model.evaluate(X_test, y_test, verbose=0))
        
        # Calculate additional metrics
        predictions = model.predict(X_test, verbose=0)
        mse = float(np.mean((predictions - y_test) ** 2))
        rmse = float(np.sqrt(mse))
        mae = float(np.mean(np.abs(predictions - y_test)))
        
        metrics = {
            'train_loss': train_loss,
            'val_loss': val_loss,
            'test_loss': test_loss,
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'epochs_trained': len(history.history['loss']),
            'train_samples': train_samples,
            'test_samples': len(X_test)
        }
        
        return metrics
    
    def _print_metrics(self, metrics: Dict):
        """Print metrics in formatted output"""
        print(f"  📈 Train Loss:      {metrics['train_loss']:.6f}")
        print(f"  📉 Validation Loss: {metrics['val_loss']:.6f}")
        print(f"  🎯 Test Loss:       {metrics['test_loss']:.6f}")
        print(f"  📊 RMSE:            {metrics['rmse']:.6f}")
        print(f"  📊 MAE:             {metrics['mae']:.6f}")
        print(f"  🔢 Epochs:          {metrics['epochs_trained']}")
    
    def _save_and_register(self, ticker: str, model, scaler, metrics: Dict) -> Dict:
        """Save model artifacts and register in MLOps registry"""
        # Save model
        model_path = os.path.join(self.artifacts_dir, f'{ticker}_lstm_model.h5')
        model.save(model_path)
        print(f"  ✅ Model saved: {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(self.artifacts_dir, f'{ticker}_scaler.pkl')
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        print(f"  ✅ Scaler saved: {scaler_path}")
        
        # Register in MLOps registry
        model_info = self.registry.register_model(
            ticker=ticker,
            model_path=model_path,
            metrics=metrics,
            scaler_path=scaler_path,
            metadata={
                'framework': 'TensorFlow/Keras',
                'model_type': 'LSTM',
                'trained_at': datetime.now().isoformat()
            }
        )
        
        return model_info
    
    def _log_error(self, ticker: str, error: str):
        """Log training errors to file"""
        error_log = os.path.join(self.logs_dir, 'training_errors.log')
        
        with open(error_log, 'a') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"[{timestamp}] {ticker}: {error}\n")
    
    def batch_train(self, tickers: list, **kwargs):
        """
        Train models for multiple tickers in batch
        
        Args:
            tickers: List of stock ticker symbols
            **kwargs: Additional arguments passed to train_model()
        
        Returns:
            Dictionary mapping tickers to their model info
        """
        results = {}
        failed = []
        
        print(f"\n{'#'*70}")
        print(f"🚀 BATCH TRAINING: {len(tickers)} stocks")
        print(f"{'#'*70}\n")
        
        for i, ticker in enumerate(tickers, 1):
            print(f"\n[{i}/{len(tickers)}] Training {ticker}...")
            
            try:
                model_info = self.train_model(ticker, **kwargs)
                results[ticker] = model_info
            except Exception as e:
                print(f"❌ Failed: {ticker} - {str(e)}")
                failed.append(ticker)
        
        # Summary
        print(f"\n{'#'*70}")
        print(f"📊 BATCH TRAINING SUMMARY")
        print(f"{'#'*70}")
        print(f"✅ Successful: {len(results)}/{len(tickers)}")
        if failed:
            print(f"❌ Failed: {', '.join(failed)}")
        print(f"{'#'*70}\n")
        
        return results


if __name__ == "__main__":
    # Example: Train single model
    pipeline = MLOpsTrainingPipeline()
    pipeline.train_model(ticker='AAPL', epochs=50)
    
    # Example: Batch training
    # stocks = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN']
    # pipeline.batch_train(stocks, epochs=50)
