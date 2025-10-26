"""
Model Evaluation Script
Evaluates trained LSTM model performance
"""

import numpy as np
import pandas as pd
import json
import os
from tensorflow.keras.models import load_model
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate_model():
    """Evaluate the trained model"""
    
    print("Starting model evaluation...")
    
    # Load model and data
    model = load_model('artifacts/stock_lstm_model.h5')
    test_data = np.load('artifacts/processed_test.npy', allow_pickle=True).item()
    
    # Split features and labels
    X_test = test_data['X']
    y_test = test_data['y']
    
    print(f"Test data shape: X={X_test.shape}, y={y_test.shape}")
    
    # Make predictions
    y_pred = model.predict(X_test, verbose=0)
    
    # Calculate metrics
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Calculate percentage error
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    
    metrics = {
        'mse': float(mse),
        'rmse': float(rmse),
        'mae': float(mae),
        'r2_score': float(r2),
        'mape': float(mape)
    }
    
    print("\n Evaluation Metrics:")
    print(f"  MSE:  {mse:.4f}")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE:  {mae:.4f}")
    print(f"  R²:   {r2:.4f}")
    print(f"  MAPE: {mape:.2f}%")
    
    # Save metrics
    os.makedirs('artifacts', exist_ok=True)
    with open('artifacts/evaluation_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("\n Metrics saved to artifacts/evaluation_metrics.json")
    
    # Create prediction plot
    plt.figure(figsize=(12, 6))
    plt.plot(y_test[:100], label='Actual', color='blue', linewidth=2)
    plt.plot(y_pred[:100], label='Predicted', color='red', linewidth=2, linestyle='--')
    plt.title('Actual vs Predicted Stock Prices', fontsize=16, fontweight='bold')
    plt.xlabel('Time Steps', fontsize=12)
    plt.ylabel('Price', fontsize=12)
    plt.legend(fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('artifacts/predictions_plot.png', dpi=150)
    plt.close()
    
    print(" Prediction plot saved to artifacts/predictions_plot.png")
    
    # Create error distribution plot
    errors = y_test.flatten() - y_pred.flatten()
    
    plt.figure(figsize=(10, 6))
    plt.hist(errors, bins=50, color='skyblue', edgecolor='black', alpha=0.7)
    plt.title('Prediction Error Distribution', fontsize=16, fontweight='bold')
    plt.xlabel('Error', fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.axvline(x=0, color='red', linestyle='--', linewidth=2, label='Zero Error')
    plt.legend(fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('artifacts/error_distribution.png', dpi=150)
    plt.close()
    
    print(" Error distribution plot saved to artifacts/error_distribution.png")
    
    return metrics

if __name__ == '__main__':
    try:
        metrics = evaluate_model()
        print("\n Evaluation completed successfully!")
    except Exception as e:
        print(f"\n Evaluation failed: {e}")
        raise
