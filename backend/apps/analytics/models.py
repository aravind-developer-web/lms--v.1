from django.db import models
from django.conf import settings
from apps.modules.models import Module

class LearningSession(models.Model):
    """
    Tracks real time invested in a module.
    Anti-cheat mechanism: increments only when pinged by active client.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='learning_sessions', on_delete=models.CASCADE)
    module = models.ForeignKey(Module, related_name='sessions', on_delete=models.CASCADE)
    video_id = models.CharField(max_length=255, blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    last_ping_at = models.DateTimeField(auto_now=True)
    total_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('completed', 'Completed')], default='active')

    class Meta:
        ordering = ['-last_ping_at']

    def __str__(self):
        return f"{self.user.username} - {self.module.title} ({self.total_seconds}s)"

class VideoProgress(models.Model):
    """
    Tracks exact video browsing progress.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='video_progress', on_delete=models.CASCADE)
    video_id = models.CharField(max_length=255)
    module = models.ForeignKey(Module, related_name='video_status', on_delete=models.CASCADE)
    watched_seconds = models.FloatField(default=0.0)
    total_seconds = models.FloatField(default=0.0)
    completion_percent = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'video_id', 'module')

    def __str__(self):
        return f"{self.user.username} - {self.video_id}: {self.completion_percent}%"

class ActivityLog(models.Model):
    """
    Tracks granular learner activities for auditing.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='activity_logs', on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action}"

class VideoEngagement(models.Model):
    """
    Tracks granular video interaction for engagement scoring.
    Source of truth for 'True Video Watching'.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='video_engagements', on_delete=models.CASCADE)
    module = models.ForeignKey(Module, related_name='engagements', on_delete=models.CASCADE)
    
    active_watch_time = models.FloatField(default=0.0) # Time spent actually watching (focus + play)
    total_duration = models.FloatField(default=0.0)    # Video length
    
    seek_count = models.PositiveIntegerField(default=0)
    playback_rate_avg = models.FloatField(default=1.0)
    focus_loss_seconds = models.FloatField(default=0.0) # Time spent tabbed away
    
    engagement_score = models.FloatField(default=0.0) # 0.0 to 1.0
    completed = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'module')
        indexes = [
            models.Index(fields=['user', 'module']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.module.title} (Score: {self.engagement_score:.2f})"

class LearningHealth(models.Model):
    """
    Weekly snapshot of learner performance.
    """
    STATUS_CHOICES = [
        ('excellent', 'Excellent'), # Score >= 80
        ('improving', 'Improving'), # Score >= 60
        ('needs_attention', 'Needs Attention') # Score < 60
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='learning_health', on_delete=models.CASCADE)
    week = models.IntegerField(default=1) # Can track health per week/module-week
    
    avg_engagement = models.FloatField(default=0.0)
    avg_quiz_score = models.FloatField(default=0.0)
    avg_assignment_score = models.FloatField(default=0.0)
    
    learning_health_score = models.FloatField(default=0.0) # 0-100
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='needs_attention')
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-week']

    def __str__(self):
        return f"{self.user.username} - Health: {self.learning_health_score}"
