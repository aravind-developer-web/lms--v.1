import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'modules_module';")
    columns = [row[0] for row in cursor.fetchall()]
    
    print(f"Columns in modules_module: {columns}")
    
    missing = []
    if 'priority' not in columns:
        missing.append('priority')
    if 'video_url' not in columns:
        missing.append('video_url')
        
    print(f"Missing columns: {missing}")
