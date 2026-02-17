import os
import django
import sys
import time
import shutil

# Load .env file manually
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.modules.models import Module
from apps.ai_engine.tasks import process_module_content
from apps.quiz.models import Quiz, Question

def run_e2e_test():
    print("Starting E2E Pipeline Verification (Gemini)...")

    # 1. Create a Test Module (URL-based for speed)
    # Using "Me at the zoo" (18s) for reliability and speed
    video_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"

    
    print("\n1. Creating Test Module...")
    module = Module.objects.create(
        title="E2E Gemini New Key Test",
        description="Testing full pipeline with new Google Gemini Key",
        week=1,
        video_url=video_url,
        processing_status='pending'
    )
    print(f"   Module Created: ID {module.id}")

    # 2. Trigger Task Synchronously
    print("\n2. executing process_module_content...")
    try:
        start_time = time.time()
        process_module_content(module.id)
        duration = time.time() - start_time
        print(f"   Task Completed in {round(duration, 2)}s")
    except Exception as e:
        print(f"   Task Failed: {e}")
        return

    # 3. Verify Results
    print("\n3. Verifying Results...")
    module.refresh_from_db()
    
    # Check Status
    print(f"   Status: {module.processing_status}")
    if module.processing_status != 'completed':
        print("   Status Check Failed")
    else:
        print("   Status Check Passed")

    # Check Transcript
    if module.transcript and len(module.transcript) > 0:
        print(f"   Transcript Generated (Length: {len(module.transcript)})")
    else:
        print("   Transcript Missing")

    # Check Content Creation Flags
    print(f"   Has Quiz: {module.has_quiz}")
    print(f"   Has Assignment: {module.has_assignment}")

    # Quiz -> Module
    quiz = Quiz.objects.filter(module=module).first()
    quiz_count = 0
    if quiz:
        print(f"   Quiz Object Found: {quiz.title}")
        quiz_count = Question.objects.filter(quiz=quiz).count()
        print(f"   Questions Linked to Quiz: {quiz_count}")
        if quiz_count == 5:
             print("   Quiz Generation Verified")
        else:
             print(f"   Quiz Generation Failed (Expected 5, found {quiz_count})")
    else:
        print("   Quiz Object Missing (CRITICAL FAILURE)")

    # Check Assignment Prompt
    if module.assignment_prompt:
        print(f"   Assignment Prompt Found: {module.assignment_prompt[:50]}...")
        print("   Assignment Generation Verified")
    else:
        print("   Assignment Prompt Missing (CRITICAL FAILURE)")

    if module.processing_status == 'completed' and quiz_count == 5 and module.assignment_prompt:
        print("\nSUCCESS: Gemini Pipeline is Fully Functional.")
    else:
        print("\nFAILURE: Pipeline validation failed.")

if __name__ == '__main__':
    run_e2e_test()
