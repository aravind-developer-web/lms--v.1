from .models import VideoEngagement, LearningHealth
from apps.progress.models import ModuleProgress
from django.db import transaction
import math

class EngagementService:
    @staticmethod
    def calculate_score(active_time, total_duration, seek_count, playback_rate, focus_loss):
        """
        Calculates engagement score based on user behavior telemetry.
        Formula: (Active Watch % - Penalties)
        """
        if total_duration == 0:
            return 0.0

        # 1. Base Score (Active Watch %)
        active_pct = active_time / total_duration
        
        # 2. Penalties
        skip_penalty = (seek_count // 3) * 0.10  # -10% per 3 seeks
        
        playback_penalty = 0.0
        if playback_rate > 1.5:
            playback_penalty = 0.15 # -15% if speeding
            
        focus_penalty = 0.0
        if focus_loss > (total_duration * 0.2): 
            focus_penalty = 0.20 # -20% if >20% focus lost

        raw_score = active_pct - (skip_penalty + playback_penalty + focus_penalty)
        
        # 3. Clamp Score (0.0 to 1.0)
        final_score = max(0.0, min(raw_score, 1.0))
        
        return final_score

    @staticmethod
    def update_engagement(user, module, data):
        """
        Updates or creates VideoEngagement record with atomic precision.
        """
        with transaction.atomic():
            engagement, created = VideoEngagement.objects.get_or_create(
                user=user, 
                module=module
            )
            
            # Update telemetry
            engagement.active_watch_time = float(data.get('active_watch_time', 0))
            engagement.total_duration = float(data.get('total_duration', 0))
            engagement.seek_count = int(data.get('seek_count', 0))
            engagement.playback_rate_avg = float(data.get('playback_rate', 1.0))
            engagement.focus_loss_seconds = float(data.get('focus_loss', 0))
            
            # Calculate Score
            score = EngagementService.calculate_score(
                engagement.active_watch_time,
                engagement.total_duration,
                engagement.seek_count,
                engagement.playback_rate_avg,
                engagement.focus_loss_seconds
            )
            
            engagement.engagement_score = score
            
            # Mark complete if score meets threshold
            if score >= 0.80 and (engagement.active_watch_time / engagement.total_duration) >= 0.8:
                engagement.completed = True
                # Trigger ModuleProgress update if needed
                ModuleProgress.objects.get_or_create(user=user, module=module, defaults={'status': 'completed'})
            
            engagement.save()
            return engagement

class HealthService:
    @staticmethod
    def calculate_health(user):
        """
        Calculates overall Learning Health Index (0-100).
        Standard: (0.4 * Video) + (0.3 * Quiz) + (0.3 * Assignment)
        """
        # Average Engagement
        engagements = VideoEngagement.objects.filter(user=user)
        avg_eng = 0.0
        if engagements.exists():
            avg_eng = sum(e.engagement_score for e in engagements) / engagements.count()
            
        # Average Quiz
        # (Assuming QuizAttempt model exists, logic simplified for now)
        avg_quiz = 0.0 # Placeholder
        
        # Average Assignment
        avg_assign = 0.0 # Placeholder
        
        # Formula
        health_score = (0.4 * (avg_eng * 100)) + (0.3 * avg_quiz) + (0.3 * avg_assign)
        health_score = max(0, min(health_score, 100))
        
        # Status
        status = 'needs_attention'
        if health_score >= 80:
            status = 'excellent'
        elif health_score >= 60:
            status = 'improving'
            
        # Update Model
        health, _ = LearningHealth.objects.update_or_create(
            user=user,
            defaults={
                'avg_engagement': avg_eng,
                'learning_health_score': health_score,
                'status': status
            }
        )
        return health
