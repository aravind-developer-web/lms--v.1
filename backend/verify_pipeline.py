import os
import sys
import django
from dotenv import load_dotenv

# Setup Django first
sys.path.append(os.path.join(os.path.dirname(__file__)))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.analytics.views import PipelineHealthView
from apps.modules.views import ModuleViewSet
from apps.modules.models import Module
from apps.authapp.models import User

def verify_pipeline():
    print("Verifying Pipeline Endpoints...")
    factory = APIRequestFactory()
    
    # Mock User
    try:
        user = User.objects.filter(role='manager').first()
        if not user:
            user = User.objects.create_user(username='test_manager', password='password', role='manager')
            print("Created test manager user.")
    except Exception as e:
        print(f"User setup failed: {e}")
        return

    # 1. Test Health Check
    print("\n--- Testing Health Check ---")
    view = PipelineHealthView.as_view()
    request = factory.get('/api/analytics/system/health/')
    force_authenticate(request, user=user)
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.data}")
        if response.status_code == 200:
            print("Health Check Passed")
        else:
            print("Health Check Failed")
    except Exception as e:
        print(f"Health Check Exception: {e}")

    # 2. Test Module Status
    print("\n--- Testing Module Status ---")
    try:
        module = Module.objects.first()
        if not module:
            print("No modules found. Skipping status check.")
        else:
            view = ModuleViewSet.as_view({'get': 'status'})
            request = factory.get(f'/api/modules/{module.id}/status/')
            force_authenticate(request, user=user)
            response = view(request, pk=module.id)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.data}")
            if response.status_code == 200 and 'processing_status' in response.data:
                 print("Module Status Check Passed")
            else:
                 print("Module Status Check Failed")

    except Exception as e:
        print(f"Module Status Exception: {e}")

if __name__ == "__main__":
    verify_pipeline()
