import os
import django
from django.conf import settings
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.modules.models import Module

def cleanup_modules():
    print("Starting module cleanup...")
    
    # Filter modules that DO NOT start with "Broadcast:"
    modules_to_delete = Module.objects.exclude(title__startswith="Broadcast:")
    
    count = modules_to_delete.count()
    
    if count == 0:
        print("No default modules found to delete.")
    else:
        print(f"Found {count} default modules to delete.")
        deleted_count, _ = modules_to_delete.delete()
        print(f"Successfully deleted {deleted_count} modules.")
        
    # Verify remaining modules
    remaining = Module.objects.all()
    print("\nRemaining Modules (Broadcasts):")
    for m in remaining:
        print(f"- [{m.week}] {m.title}")

if __name__ == "__main__":
    cleanup_modules()
