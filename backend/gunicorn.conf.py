"""Gunicorn settings for the container. WEB_CONCURRENCY overrides the worker count."""
import os

bind = "0.0.0.0:8000"
worker_class = "uvicorn.workers.UvicornWorker"
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
timeout = 60
graceful_timeout = 30
