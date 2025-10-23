import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib
import os
from dotenv import load_dotenv

load_dotenv()

class DataTransformation:
    def __init__(self):
        self.scaler = MinMaxScaler()
        
    def create_sequences(self, data, seq_length=60):
        X, y = [], []
        for i in range(len(data) - seq_length):
            X.append(data[i:i+seq_length])
            y.append(data[i+seq_length, 0])
        return np.array(X), np.array(y)
    
    def initiate_data_transformation(self, train_path, test_path):
        os.makedirs('artifacts', exist_ok=True)
        
        train_data = pd.read_csv(train_path).values
        test_data = pd.read_csv(test_path).values
        
        train_scaled = self.scaler.fit_transform(train_data)
        test_scaled = self.scaler.transform(test_data)
        
        X_train, y_train = self.create_sequences(train_scaled)
        X_test, y_test = self.create_sequences(test_scaled)
        
        np.save('artifacts/processed_train.npy', {'X': X_train, 'y': y_train})
        np.save('artifacts/processed_test.npy', {'X': X_test, 'y': y_test})
        joblib.dump(self.scaler, 'artifacts/scaler.pkl')
        
        return X_train, y_train, X_test, y_test

if __name__ == "__main__":
    obj = DataTransformation()
    obj.initiate_data_transformation('artifacts/train_stock_data.csv', 'artifacts/test_stock_data.csv')