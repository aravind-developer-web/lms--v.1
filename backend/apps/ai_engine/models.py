from django.db import models
from apps.modules.models import Module

class AILog(models.Model):
    MODULE_STAGES = (
        ('transcription', 'Transcription'),
        ('generation', 'Generation'),
    )
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failure', 'Failure'),
    )

    module = models.ForeignKey(Module, related_name='ai_logs', on_delete=models.CASCADE)
    stage = models.CharField(max_length=20, choices=MODULE_STAGES)
    provider = models.CharField(max_length=50, default='gemini')
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.module.title} - {self.stage} ({self.status})"
