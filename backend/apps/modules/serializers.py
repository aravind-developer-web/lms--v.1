from rest_framework import serializers
from .models import Module, Resource
from apps.analytics.models import VideoEngagement
from apps.quiz.models import QuizAttempt

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    is_quiz_locked = serializers.SerializerMethodField()
    is_assignment_locked = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = '__all__'
        read_only_fields = ('processing_status', 'error_message', 'ai_generated_data', 'transcript', 'video_type')

    def get_is_quiz_locked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return True
            
        # Manager Override
        if request.user.role in ['manager', 'admin']:
            return False

        # Rule: Engagement > 80% to unlock
        try:
            engagement = VideoEngagement.objects.get(user=request.user, module=obj)
            # Check both score and raw watch time %
            if engagement.engagement_score >= 0.8 and (engagement.active_watch_time / engagement.total_duration) >= 0.8:
                return False
        except VideoEngagement.DoesNotExist:
            pass # No record = Locked
        except ZeroDivisionError:
            pass 
            
        return True

    def get_is_assignment_locked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return True
            
        if request.user.role in ['manager', 'admin']:
            return False

        # Rule: Quiz Passed to unlock Assignment
        # Check if user has passed the quiz for this module
        if not obj.has_quiz:
             return False # No quiz = unlocked

        passed = QuizAttempt.objects.filter(
            user=request.user, 
            quiz__module=obj, 
            score__gte=70 # Passing score hardcoded for now, ideal: obj.quiz.passing_score
        ).exists()
        
        return not passed

class ResourceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ('title', 'description', 'type', 'url', 'order')
