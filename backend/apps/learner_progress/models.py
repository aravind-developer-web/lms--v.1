from django.db import models
from django.conf import settings
from apps.modules.models import Module

class LearnerModuleProgress(models.Model):
    STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)

    video_percent = models.FloatField(default=0)
    quiz_percent = models.FloatField(default=0)
    assignment_percent = models.FloatField(default=0)

    is_video_completed = models.BooleanField(default=False)
    is_quiz_completed = models.BooleanField(default=False)
    is_assignment_completed = models.BooleanField(default=False)

    module_status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='not_started'
    )

    completed_at = models.DateTimeField(null=True, blank=True)
    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'module')
        indexes = [
            models.Index(fields=['user', 'module']),
        ]

    def __str__(self):
        return f"{self.user} - {self.module}: {self.module_status}"

    def update_status(self):
        """
        Updates module status based on strict completion rules.
        """
        # 1. Determine requirements
        has_quiz = self.module.has_quiz
        has_assignment = self.module.has_assignment

        # 2. Check Completions
        # Video: >= 80% required
        video_done = self.video_percent >= 80
        
        # Quiz: >= 80% required (if exists)
        if has_quiz:
            quiz_done = self.quiz_percent >= 80
        else:
            quiz_done = True

        # Assignment: Must be submitted (if exists)
        if has_assignment:
            assignment_done = self.is_assignment_completed
        else:
            assignment_done = True

        # 3. Aggregation Logic
        if video_done and quiz_done and assignment_done:
            self.module_status = 'completed'
            if not self.completed_at:
                from django.utils import timezone
                self.completed_at = timezone.now()
        elif self.video_percent > 0:
            self.module_status = 'in_progress'
        else:
            self.module_status = 'not_started'
        
        self.save()
