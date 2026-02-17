import os
import django
from django.db import connection
import dotenv

# Load environment variables
dotenv.load_dotenv()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

def drop_tables():
    tables = ['analytics_learningsession', 'analytics_videoprogress', 'analytics_activitylog']
    print(f"Dropping tables: {tables}")
    with connection.cursor() as cursor:
        for table in tables:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
                print(f"Dropped {table}")
            except Exception as e:
                print(f"Error dropping {table}: {e}")

if __name__ == "__main__":
    drop_tables()
