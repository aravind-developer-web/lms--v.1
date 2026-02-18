from django.urls import path
from .views import (
    ProgressSummaryView, 
    ModuleProgressDetailView, 
    ModuleProgressListView,
    VideoProgressView,
    QuizProgressView,
    AssignmentProgressView,
    LearnerDashboardView
)

urlpatterns = [
    path('summary/', ProgressSummaryView.as_view(), name='progress-summary'),
    path('modules/', ModuleProgressListView.as_view(), name='module-progress-list'),
    path('module/<int:module_id>/', ModuleProgressDetailView.as_view(), name='module-progress-detail'),
    
    # New Push-based Endpoints
    path('video/', VideoProgressView.as_view(), name='video-progress'),
    path('quiz/', QuizProgressView.as_view(), name='quiz-progress'),
    path('assignment/', AssignmentProgressView.as_view(), name='assignment-progress'),
    path('dashboard/', LearnerDashboardView.as_view(), name='learner-dashboard'),
]
