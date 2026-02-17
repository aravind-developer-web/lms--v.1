import os
import sys
import django
from dotenv import load_dotenv

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__)))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.utils.supabase_storage import SupabaseStorage

def create_public_bucket():
    print("Attempting to Create Public Bucket: 'lms-videos'...")
    storage = SupabaseStorage()
    bucket_name = "lms-videos"

    try:
        # Check if bucket exists
        buckets = storage.client.storage.list_buckets()
        existing = next((b for b in buckets if b.name == bucket_name), None)

        if existing:
            print(f"Bucket '{bucket_name}' already exists.")
            print(f"Current Public Status: {existing.public}")
            if not existing.public:
                 print("Bucket is PRIVATE. Attempting to update to PUBLIC...")
                 try:
                     storage.client.storage.update_bucket(bucket_name, {"public": True})
                     print("Bucket updated to PUBLIC.")
                 except Exception as update_err:
                     print(f"Failed to update bucket public status: {update_err}")
                     print("Action Required: Please toggle 'Public' in Supabase Dashboard -> Storage -> Settings.")
        else:
            # Create new public bucket
            print(f"Creating new public bucket '{bucket_name}'...")
            try:
                # Try with explicit options dict
                storage.client.storage.create_bucket(bucket_name, options={"public": True})
                print(f"Bucket '{bucket_name}' created successfully (Public).")
            except Exception as e1:
                print(f"Method 1 failed: {e1}")
                try:
                    # Fallback: Create private then update
                    storage.client.storage.create_bucket(bucket_name)
                    print(f"Bucket '{bucket_name}' created (Private). Updating to Public...")
                    storage.client.storage.update_bucket(bucket_name, {"public": True})
                    print(f"Bucket '{bucket_name}' updated to PUBLIC.")
                except Exception as e2:
                    print(f"Method 2 failed: {e2}")
                    raise e2

    except Exception as e:
        print(f"Error managing bucket: {e}")

if __name__ == "__main__":
    create_public_bucket()
