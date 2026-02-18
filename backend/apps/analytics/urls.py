from django.urls import path
from .views import (
    ManagerLearnerProgressView, 
    ManagerLearnerDetailsView, 
    VideoProgressUpdateView, 
    SessionPingView,
    EngagementHeartbeatView,
    HealthMetricsView,
    PipelineHealthView,
    ManagerWeekProgressView
)

urlpatterns = [
    path('manager/week-progress/', ManagerWeekProgressView.as_view(), name='manager_week_progress'),
    path('manager/learner-progress/', ManagerLearnerProgressView.as_view(), name='manager_learner_progress'),
    path('manager/<int:user_id>/learner_details/', ManagerLearnerDetailsView.as_view(), name='manager_learner_details'),
    path('progress/video-update/', VideoProgressUpdateView.as_view(), name='video_progress_update'),
    path('session/ping/', SessionPingView.as_view(), name='session_ping'),
    
    # New Intelligence Endpoints
    path('engagement/heartbeat/', EngagementHeartbeatView.as_view(), name='engagement_heartbeat'),
    path('health/', HealthMetricsView.as_view(), name='health_metrics'),
    path('system/health/', PipelineHealthView.as_view(), name='pipeline_health'),
]
