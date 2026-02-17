import os
import sys
import django
from celery import Celery

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from redis import Redis

def check_redis():
    print("--- 1. Checking Redis Connection ---")
    redis_url = settings.CELERY_BROKER_URL
    print(f"Broker URL: {redis_url}")
    
    try:
        r = Redis.from_url(redis_url)
        r.ping()
        print("SUCCESS: Connected to Redis!")
        return True
    except Exception as e:
        print(f"FAILURE: Could not connect to Redis. Error: {e}")
        return False

def check_celery_queue():
    print("\n--- 2. Checking Celery Task Queueing ---")
    from config.celery import app
    
    try:
        # Define a temporary dummy task signature if needed, or just ping
        # We will try to inspect the queue
        i = app.control.inspect()
        stats = i.stats()
        if stats:
             print(f"SUCCESS: Celery Workers Found: {list(stats.keys())}")
        else:
             print("WARNING: No running Celery workers found (Tasks will be queued but not executed).")
             
    except Exception as e:
        print(f"FAILURE: Celery Inspection Error: {e}")

if __name__ == "__main__":
    if check_redis():
        check_celery_queue()
    else:
        print("\nCRITICAL: Redis is down. AI Automation cannot start.")
