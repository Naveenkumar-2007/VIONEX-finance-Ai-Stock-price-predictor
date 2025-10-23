import numpy as np
import joblib
import json
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.metrics import mean_squared_error
import os
import mlflow
import mlflow.tensorflow
from dotenv import load_dotenv

load_dotenv()

class ModelTrainer:
    def __init__(self):
        self.model = None
        
    def build_model(self, input_shape):
        self.model = Sequential([
            LSTM(100, return_sequences=True, input_shape=input_shape),
            Dropout(0.3),
            LSTM(100, return_sequences=True),
            Dropout(0.3),
            LSTM(50, return_sequences=False),
            Dropout(0.3),
            Dense(25, activation='relu'),
            Dense(1)
        ])
        self.model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])
        
    def train(self, X_train, y_train, X_test, y_test, epochs=100, batch_size=32):
        self.build_model((X_train.shape[1], X_train.shape[2]))
        
        # Add early stopping to prevent overfitting
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)
        reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001)
        
        history = self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, 
                                validation_data=(X_test, y_test), verbose=1,
                                callbacks=[early_stop, reduce_lr])
        
        predictions = self.model.predict(X_test)
        mse = mean_squared_error(y_test, predictions)
        
        os.makedirs('artifacts', exist_ok=True)
        self.model.save('artifacts/stock_lstm_model.h5')
        with open('artifacts/model_metrics.json', 'w') as f:
            json.dump({'mse': mse, 'history': history.history}, f)
        
        mlflow.log_param("epochs", epochs)
        mlflow.log_metric("val_loss", history.history['val_loss'][-1])
        
        return mse
    
    def initiate_model_training(self):
        train_data = np.load('artifacts/processed_train.npy', allow_pickle=True).item()
        test_data = np.load('artifacts/processed_test.npy', allow_pickle=True).item()
        
        X_train, y_train = train_data['X'], train_data['y']
        X_test, y_test = test_data['X'], test_data['y']
        
        mse = self.train(X_train, y_train, X_test, y_test)
        print(f"Model trained with MSE: {mse}")
        
        return mse

if __name__ == "__main__":
    obj = ModelTrainer()
    obj.initiate_model_training()