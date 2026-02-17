from rest_framework import serializers
from apps.modules.models import Module
import os

class ModuleUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['title', 'week', 'video_file', 'video_url', 'description']
        extra_kwargs = {
            'video_file': {'required': False},
            'video_url': {'required': False}
        }

    def validate(self, data):
        """
        Ensure either video_file or video_url is provided.
        """
        if not data.get('video_file') and not data.get('video_url'):
            raise serializers.ValidationError("Please provide either a Video File or a YouTube URL.")
        return data

    def validate_video_file(self, value):
        """
        Validate file size and extension.
        """
        if not value:
            return value

        # 1. Size Validation (Limit to 500MB)
        limit_mb = 500
        if value.size > limit_mb * 1024 * 1024:
            raise serializers.ValidationError(f"File too large. Size should not exceed {limit_mb} MB.")

        # 2. Extension Validation
        ext = os.path.splitext(value.name)[1]
        valid_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
        if not ext.lower() in valid_extensions:
            raise serializers.ValidationError(f"Unsupported file extension. Allowed: {', '.join(valid_extensions)}")

        return value
