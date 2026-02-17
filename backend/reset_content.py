import os
import sys
import django
from dotenv import load_dotenv

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__)))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.modules.models import Module, Resource
from apps.analytics.models import VideoEngagement
from apps.quiz.models import QuizAttempt, Quiz

def reset_content():
    print("STARTING CONTENT RESET")
    
    # Check current count
    mod_count = Module.objects.count()
    print(f"Current Modules: {mod_count}")
    
    # Delete All Modules (Cascades to Resources, Engagements, Quizzes)
    deleted, breakdown = Module.objects.all().delete()
    
    print(f"\nDeleted {deleted} objects:")
    for model, count in breakdown.items():
        print(f" - {model}: {count}")

    print("\nSystem is clean. Ready for fresh uploads.")

if __name__ == "__main__":
    reset_content()
