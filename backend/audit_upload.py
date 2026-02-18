import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.modules.models import Module
from apps.ai_engine.tasks import process_module_content
from django.core.files.uploadedfile import SimpleUploadedFile

def audit_upload():
    print("\n--- MANAGER UPLOAD & AI PIPELINE AUDIT ---")

    # 1. Simulate Video Upload
    print("1. Creating Test Module with Video...")
    try:
        # Create a dummy video file logic or use a YouTube URL for stability in test
        # Using YouTube URL to avoid needing a real mp4 file on disk for this script
        module = Module.objects.create(
            title="Audit Test Module: Intro to AI",
            description="Testing AI Pipeline",
            video_url="https://www.youtube.com/watch?v=jGwO_UgTS7I", # Short AI intro video
            week=1
        )
        print(f"[OK] Module Created: ID {module.id}")
    except Exception as e:
        print(f"[FAIL] Module Creation Failed: {e}")
        return

    # 2. Trigger Celery Task Manually (Synchronous for Audit)
    print("2. Triggering AI Pipeline (Sync Mode)...")
    try:
        # We call the task function directly to verify logic without waiting for a worker
        # In prod, this is async. Here we test the logic itself.
        result = process_module_content(module.id)
        print(f"[OK] AI Task Executed. Result: {result}")
    except Exception as e:
        print(f"[FAIL] AI Task Failed: {e}")
        return

    # 3. Verify Artifacts
    print("3. Verifying Generated Content...")
    module.refresh_from_db()
    
    # Check Transcript
    if module.transcript:
        print(f"✅ Transcript Generated ({len(module.transcript)} chars)")
    else:
        print("❌ Transcript Missing")

    # Check Quiz
    if hasattr(module, 'quiz'):
        print(f"[OK] Quiz Created: {module.quiz.title}")
        print(f"   Questions: {module.quiz.questions.count()}")
    else:
        print("[FAIL] Quiz Missing")

    # Check Assignment
    questions = module.assignment_questions.all()
    if questions.exists():
        print(f"[OK] Assignment Questions Created: {questions.count()}")
        print(f"   Title: {questions.first().title}")
    else:
        print("[FAIL] Assignment Questions Missing")

    # Check Status
    if module.processing_status == 'completed':
        print("[OK] Processing Status: Completed")
    else:
        print(f"[FAIL] Processing Status: {module.processing_status}")

if __name__ == "__main__":
    audit_upload()
