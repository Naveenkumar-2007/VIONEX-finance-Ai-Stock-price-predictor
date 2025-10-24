"""
Gunicorn configuration for Azure App Service
Optimized for ML model loading with TensorFlow/Keras
"""

import multiprocessing
import os

# Server Socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker Processes
workers = 1  # Use 1 worker to avoid multiple model loads (saves memory)
worker_class = 'sync'
worker_connections = 1000
timeout = 600  # 10 minutes - allows time for model loading
keepalive = 2
graceful_timeout = 120

# Pre-load app before forking workers
preload_app = True

# Logging
loglevel = 'info'
accesslog = '-'  # Log to stdout
errorlog = '-'   # Log to stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process Naming
proc_name = 'stock-predictor'

# Server Mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Preload optimization
def on_starting(server):
    """
    Called just before the master process is initialized.
    """
    server.log.info("=" * 60)
    server.log.info("Starting Stock Prediction App")
    server.log.info("Loading TensorFlow and LSTM model...")
    server.log.info("=" * 60)

def when_ready(server):
    """
    Called just after the server is started.
    """
    server.log.info("=" * 60)
    server.log.info("Gunicorn server ready and listening")
    server.log.info("=" * 60)

def worker_int(worker):
    """
    Called when worker receives INT or QUIT signal
    """
    worker.log.info("Worker received INT or QUIT signal")

def worker_abort(worker):
    """
    Called when worker receives SIGABRT signal
    """
    worker.log.info("Worker received SIGABRT signal")
