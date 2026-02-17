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

def check_bucket():
    print("Running Bucket Check...")
    storage = SupabaseStorage()
    
    try:
        # 1. Upload Test File
        print("Uploading test file...")
        from django.core.files.base import ContentFile
        test_content = b"Hello World"
        test_file = ContentFile(test_content, name="test_access.txt")
        
        url = storage.upload_file(test_file)
        print(f"Uploaded to: {url}")
        
        # 2. Verify Public Access
        import requests
        print("Verifying public access...")
        resp = requests.get(url)
        
        if resp.status_code == 200 and resp.content == test_content:
            print("✅ Bucket is PUBLIC. File accessible.")
        else:
            print(f"❌ Bucket is PRIVATE or Inaccessible. Status: {resp.status_code}")
            print("Action Required: Make 'lms-videos' bucket PUBLIC in Supabase Dashboard.")

    except Exception as e:
        print(f"Error accessing bucket: {e}")

if __name__ == "__main__":
    check_bucket()
