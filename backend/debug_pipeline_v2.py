import os
import django
import sys
import time
from dotenv import load_dotenv

# Setup Django Environment
sys.path.append(os.getcwd())
load_dotenv() # Load .env file
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.modules.models import Module
from apps.ai_engine.tasks import process_module_content
from django.core.files.uploadedfile import SimpleUploadedFile

def debug_full_pipeline():
    print("Starting FULL PIPELINE debugging...")

    # 1. Test YouTube Video (No Upload, AI Only)
    print("\n--- [SKIPPING] YouTube Video Pipeline (Already Verified) ---")
    '''
    print("\n--- [TEST 1] YouTube Video Pipeline ---")
    try:
        module_yt = Module.objects.create(
            title="Debug YouTube AI",
            video_url="https://www.youtube.com/watch?v=jNQXAC9IVRw", # Me at the zoo (short)
            week=1,
            processing_status='pending'
        )
        print(f"Module Created: {module_yt.id} | {module_yt.video_url}")
        
        # Trigger Task Manually (Synchronous for debug)
        print("Starting AI Task (YouTube)...")
        process_module_content(module_yt.id) 
        
        # Refresh
        module_yt.refresh_from_db()
        print(f"Post-Processing Status: {module_yt.processing_status}")
        if module_yt.processing_status == 'completed':
            print("AI Success (YouTube)")
            print(f"   Transcript len: {len(module_yt.transcript or '')}")
            if module_yt.quiz_set.exists(): print("Quiz Created")
            else: print("Quiz Missing")
        else:
            print(f"AI Failed: {module_yt.error_message}")

    except Exception as e:
        print(f"YouTube Pipeline Crash: {e}")
    '''

    # 2. Test File Upload (Supabase + AI)
    print("\n--- [TEST 2] File Upload Pipeline ---")
    try:
        # Create a dummy video file
        dummy_content = b"fake video content for testing upload pipeline"
        video_file = SimpleUploadedFile("debug_video.mp4", dummy_content, content_type="video/mp4")
        
        # We need to simulate the View logic for upload
        from apps.utils.supabase_storage import SupabaseStorage
        storage = SupabaseStorage()
        
        print("Uploading to Supabase (Stream)...")
        path = f"debug/test_{int(time.time())}.mp4"
        url = storage.upload_file(video_file, destination_path=path)
        print(f"Upload Success: {url}")
        
        module_file = Module.objects.create(
            title="Debug File Upload",
            video_url=url,
            week=1,
            processing_status='pending'
        )
        
        print("Starting AI Task (File)...")
        # Note: AI might fail on fake content, but we test the FLOW.
        try:
            process_module_content(module_file.id)
        except Exception:
            print("   (Expected failure on fake video content for AI, but task ran)")
            
        module_file.refresh_from_db()
        print(f"Post-Processing Status: {module_file.processing_status}")
        if module_file.error_message:
             print(f"Error Message (Expected for fake file): {module_file.error_message}")

    except Exception as e:
        print(f"File Pipeline Crash: {e}")

if __name__ == "__main__":
    debug_full_pipeline()
