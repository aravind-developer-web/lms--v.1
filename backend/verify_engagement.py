import os
import sys
import django
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.modules.models import Module
from apps.analytics.models import VideoEngagement
from apps.analytics.services import EngagementService
from rest_framework.test import APIRequestFactory

User = get_user_model()

def verify_engagement():
    print("Starting Engagement Logic Verification...")
    
    # 1. Setup Data
    user, _ = User.objects.get_or_create(username='test_learner', email='test@example.com', role='learner')
    module, _ = Module.objects.get_or_create(title='Test Module', duration=10)
    
    print(f"User: {user.username}")
    print(f"Module: {module.title}")

    # 2. Simulate Heartbeat (Low Engagement)
    print("\n--- Test 1: Low Engagement Heartbeat ---")
    data_low = {
        'active_watch_time': 10,
        'total_duration': 100,
        'seek_count': 5, # Penalty
        'playback_rate': 1.0,
        'focus_loss': 0
    }
    
    eng = EngagementService.update_engagement(user, module, data_low)
    print(f"Heartbeat Sent. Score: {eng.engagement_score:.2f}")
    print(f"Is Completed? {eng.completed}")
    
    if eng.engagement_score < 0.2:
        print("PASS: Low score correctly calculated.")
    else:
        print("FAIL: Score too high for low engagement.")

    # 3. Simulate Heartbeat (High Engagement)
    print("\n--- Test 2: High Engagement Heartbeat ---")
    data_high = {
        'active_watch_time': 95,
        'total_duration': 100,
        'seek_count': 0,
        'playback_rate': 1.0,
        'focus_loss': 0
    }
    
    eng = EngagementService.update_engagement(user, module, data_high)
    print(f"Heartbeat Sent. Score: {eng.engagement_score:.2f}")
    print(f"Is Completed? {eng.completed}")
    
    if eng.engagement_score > 0.9 and eng.completed:
        print("PASS: High score correctly unlocked module.")
    else:
        print(f"FAIL: Failed to unlock. Score: {eng.engagement_score}")

    # 4. Verify Locking Logic (via Serializer)
    from apps.modules.serializers import ModuleSerializer
    # Mock request context
    class MockRequest:
        def __init__(self, user):
            self.user = user

    serializer = ModuleSerializer(module, context={'request': MockRequest(user)})
    print(f"\nExample Serializer Output: Quiz Locked? {serializer.data['is_quiz_locked']}")

    if not serializer.data['is_quiz_locked']:
        print("PASS: Serializer correctly reports UNLOCKED.")
    else:
         print("FAIL: Serializer reports LOCKED (Expected Unlocked).")

if __name__ == "__main__":
    verify_engagement()
