from django.db import models
from django.conf import settings
from apps.modules.models import Module

class Assignment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assignments', on_delete=models.CASCADE)
    module = models.ForeignKey(Module, related_name='assignments', on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_assignments', on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    content = models.TextField(blank=True, help_text="Submitted assignment content")
    due_date = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'module')

    def __str__(self):
        return f"{self.user.username} - {self.module.title}"

class AssignmentQuestion(models.Model):
    module = models.ForeignKey(Module, related_name='assignment_questions', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    def __str__(self):
        return f"{self.module.title} - Question"

