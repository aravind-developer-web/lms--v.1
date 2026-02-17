from django.db import models
from django.conf import settings

class Module(models.Model):
    DIFFICULTY_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )

    PROCESSING_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    video_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL to the module video (YouTube, Vimeo, etc.)")
    video_file = models.FileField(upload_to='videos/', blank=True, null=True)
    video_type = models.CharField(
        max_length=20,
        choices=[('upload', 'Upload'), ('youtube', 'YouTube')],
        default='upload'
    )
    transcript = models.TextField(blank=True, null=True)
    processing_status = models.CharField(max_length=20, choices=PROCESSING_STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True, help_text="Error message if processing failed")
    ai_generated_data = models.JSONField(blank=True, null=True)
    
    week = models.PositiveIntegerField(default=1, choices=[(i, f"Week {i}") for i in range(1, 5)])
    duration = models.PositiveIntegerField(help_text="Duration in minutes", default=30)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    assignment_prompt = models.TextField(blank=True, help_text="Instructions for the module assignment")
    priority = models.PositiveIntegerField(default=0)
    has_assignment = models.BooleanField(default=False)
    has_quiz = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-detect video type
        if self.video_url and ("youtube.com" in self.video_url or "youtu.be" in self.video_url):
            self.video_type = 'youtube'
        elif self.video_file:
            self.video_type = 'upload'
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['week', 'id']

class Resource(models.Model):
    TYPE_CHOICES = (
        ('video', 'Video'),
        ('pdf', 'PDF'),
        ('url', 'External URL'),
    )

    module = models.ForeignKey(Module, related_name='resources', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    url = models.URLField(max_length=500)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} ({self.type})"
