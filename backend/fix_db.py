import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    # Check if columns exist to avoid error
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'modules_module' AND column_name = 'has_assignment';")
    if not cursor.fetchone():
        print("Adding has_assignment column...")
        cursor.execute("ALTER TABLE modules_module ADD COLUMN has_assignment BOOLEAN DEFAULT FALSE NOT NULL;")
    else:
        print("has_assignment column already exists.")

    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'modules_module' AND column_name = 'has_quiz';")
    if not cursor.fetchone():
        print("Adding has_quiz column...")
        cursor.execute("ALTER TABLE modules_module ADD COLUMN has_quiz BOOLEAN DEFAULT FALSE NOT NULL;")
    else:
        print("has_quiz column already exists.")
        
    print("Database columns fixed.")
