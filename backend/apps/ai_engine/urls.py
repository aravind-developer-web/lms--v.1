from django.urls import path
from .views import UploadModuleView

urlpatterns = [
    path('upload/', UploadModuleView.as_view(), name='ai_module_upload'),
]
