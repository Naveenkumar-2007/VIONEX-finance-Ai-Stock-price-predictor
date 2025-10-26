"""
Automated Scheduler Service - Runs training pipeline at scheduled intervals
Operates independently of Flask server
"""

import schedule
import time
from datetime import datetime
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mlops.training_pipeline import MLOpsTrainingPipeline


class SchedulerService:
    """
    Background service for automated model training
    """
    
    def __init__(self, stocks: list = None, registry_path: str = 'mlops/model_registry'):
        """
        Initialize the scheduler service
        
        Args:
            stocks: List of stock tickers to train
            registry_path: Path to model registry
        """
        self.stocks = stocks or ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN']
        self.pipeline = MLOpsTrainingPipeline(registry_path)
        self.is_running = False
        self.training_count = 0
    
    def train_all_stocks(self):
        """Train models for all configured stocks"""
        self.training_count += 1
        
        print(f"\n{'#'*70}")
        print(f"SCHEDULED TRAINING SESSION #{self.training_count}")
        print(f"{'#'*70}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Stocks: {', '.join(self.stocks)}")
        print(f"{'#'*70}\n")
        
        start_time = time.time()
        results = self.pipeline.batch_train(
            tickers=self.stocks,
            epochs=50,
            batch_size=32
        )
        elapsed_time = time.time() - start_time
        
        # Print summary
        print(f"\n{'#'*70}")
        print(f"SESSION #{self.training_count} SUMMARY")
        print(f"{'#'*70}")
        print(f"Successful: {len(results)}/{len(self.stocks)}")
        print(f"Duration: {elapsed_time/60:.2f} minutes")
        print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'#'*70}\n")
    
    def start(self, interval_hours: int = 1):
        """
        Start the scheduler service
        
        Args:
            interval_hours: Training interval in hours (default: 1)
        """
        print(f"Configuration:")
        print(f"Training Interval: Every {interval_hours} hour(s)")
        print(f"Stocks: {', '.join(self.stocks)}")
        print(f"Auto-restart: Enabled")
        print(f"{'='*70}\n")
        
        # Schedule training
        schedule.every(interval_hours).hours.do(self.train_all_stocks)
        
        # Run initial training immediately
        print(f"Running initial training session...\n")
        self.train_all_stocks()
        
        # Keep running
        self.is_running = True
        print(f"\n Scheduler is now running...")
        print(f" Next training: {schedule.jobs[0].next_run.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Press Ctrl+C to stop\n")
        
        try:
            while self.is_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """Stop the scheduler service"""
        print(f"Total training sessions completed: {self.training_count}")
        print(f"Stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*70}\n")
        
        self.is_running = False
    
    def get_status(self) -> dict:
        """
        Get current scheduler status
        
        Returns:
            Dictionary containing status information
        """
        return {
            'is_running': self.is_running,
            'stocks': self.stocks,
            'training_count': self.training_count,
            'next_run': schedule.jobs[0].next_run if schedule.jobs else None
        }


if __name__ == "__main__":
    # Configuration
    STOCKS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN']
    INTERVAL_HOURS = 1  # Train every hour
    
    # Create and start scheduler
    scheduler = SchedulerService(stocks=STOCKS)
    
    try:
        scheduler.start(interval_hours=INTERVAL_HOURS)
    except KeyboardInterrupt:
        scheduler.stop()
