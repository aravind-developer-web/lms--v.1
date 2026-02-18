import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.modules.models import Module
from apps.learner_progress.models import LearnerModuleProgress

User = get_user_model()

def audit_progress():
    print("\n--- LEARNER PROGRESS LOGIC AUDIT ---")

    # 1. Setup Data
    learner = User.objects.get(email='learner1@lms.com')
    module = Module.objects.first()
    
    if not module:
        print("[FAIL] No modules found to test")
        return

    # Force enable quiz/assignment flags for testing logic
    module.has_quiz = True
    module.has_assignment = True
    module.save()

    print(f"Testing with Module: {module.title}")
    
    # 2. Reset Progress
    progress, created = LearnerModuleProgress.objects.get_or_create(user=learner, module=module)
    progress.video_percent = 0
    progress.quiz_percent = 0
    progress.is_assignment_completed = False
    progress.module_status = 'not_started'
    progress.save()

    # 3. Test Cases
    print("\nTest Case 1: Video 50% (Expected: In Progress)")
    progress.video_percent = 50
    progress.update_status()
    if progress.module_status == 'in_progress':
        print("[OK] Status: In Progress")
    else:
        print(f"[FAIL] Status: {progress.module_status}")

    print("\nTest Case 2: Video 100% Only (Expected: In Progress)")
    progress.video_percent = 100
    progress.update_status()
    if progress.module_status == 'in_progress':
        print("[OK] Status: In Progress (Video Only)")
    else:
        print(f"[FAIL] Status: {progress.module_status} (Should wait for quiz/assignment)")

    print("\nTest Case 3: Video 100% + Quiz 90% (Expected: In Progress)")
    progress.quiz_percent = 90
    progress.update_status()
    if progress.module_status == 'in_progress':
        print("[OK] Status: In Progress (Waiting for Assignment)")
    else:
        print(f"[FAIL] Status: {progress.module_status}")

    print("\nTest Case 4: All Complete (Expected: Completed)")
    progress.is_assignment_completed = True
    progress.update_status()
    if progress.module_status == 'completed':
        print("[OK] Status: Completed")
    else:
        print(f"[FAIL] Status: {progress.module_status}")

if __name__ == "__main__":
    audit_progress()
