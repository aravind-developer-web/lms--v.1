from django.urls import path
from .views import DeepPipelineHealthView

urlpatterns = [
    path("deep-health/", DeepPipelineHealthView.as_view()),
]
