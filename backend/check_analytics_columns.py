import os
import django
from django.db import connection
import dotenv

# Load environment variables
dotenv.load_dotenv()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

def check_columns():
    table_name = 'analytics_learningsession'
    print(f"Checking columns for table: {table_name}")
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}';")
        columns = [row[0] for row in cursor.fetchall()]
        print("Columns found:", columns)
        
        if 'module_id' in columns:
            print("SUCCESS: 'module_id' column exists.")
        else:
            print("FAILURE: 'module_id' column is MISSING.")

if __name__ == "__main__":
    check_columns()
