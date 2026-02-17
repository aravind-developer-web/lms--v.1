import os
import django
from dotenv import load_dotenv

# Load env file explicitly
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.modules.models import Module
from apps.ai_engine.tasks import process_module_content

def force_run():
    # targeted module 26 ('GEN AI') or latest
    try:
        module = Module.objects.order_by('-id').first()
        if not module:
            print("No module found.")
            return
            
        print(f"Force processing Module {module.id}: {module.title}...")
        
        # Call the task function directly (bypassing Celery)
        # Note: tasks decorated with @shared_task are callable directly
        result = process_module_content(module.id)
        
        print(f"Task finished. Result: {result}")
        print("Check dashboard/diagnose script for generated content.")
        
    except Exception as e:
        print(f"FATAL ERROR during force processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    force_run()
