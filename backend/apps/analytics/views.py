from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Sum, Avg, Q, F
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import VideoProgress, LearningSession, VideoEngagement, LearningHealth
from apps.quiz.models import QuizAttempt
from apps.assignments.models import Assignment
from apps.modules.models import Module
from .services import EngagementService, HealthService
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class EngagementHeartbeatView(APIView):
    """
    Receives periodic pings from frontend to track 'True Engagement'.
    POST /analytics/engagement/heartbeat/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            module_id = request.data.get('module_id')
            data = request.data # {active_watch_time, total_duration, seek_count...}
            
            if not module_id:
                return Response({'error': 'Module ID required'}, status=400)
                
            module = Module.objects.get(id=module_id)
            
            # Service Update
            engagement = EngagementService.update_engagement(
                user=request.user,
                module=module,
                data=data
            )
            
            return Response({
                'status': 'updated',
                'score': engagement.engagement_score
            })
            
        except Exception as e:
            logger.error(f"Heartbeat Error: {e}")
            return Response({'error': str(e)}, status=500)

class HealthMetricsView(APIView):
    """
    GET /analytics/health/
    Returns current health score for dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Get latest or calculate
            health = HealthService.calculate_health(request.user)
            
            return Response({
                'score': health.learning_health_score,
                'status': health.status,
                'breakdown': {
                    'engagement': health.avg_engagement * 100,
                    'quiz': health.avg_quiz_score,
                    'assignment': health.avg_assignment_score
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ManagerLearnerProgressView(APIView):
    """
    Control Tower API: Aggregates real-time learner progress.
    Formula: (0.4 * video) + (0.3 * quiz) + (0.3 * assignment)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Only managers/admins should see this
        if request.user.role not in ['manager', 'admin', 'oversight']:
            return Response({'error': 'Unauthorized'}, status=403)

        learners = User.objects.filter(role='learner').order_by('username')
        total_modules = Module.objects.count() or 1
        
        data = []
        for learner in learners:
            # 1. Video Progress
            video_avg = VideoProgress.objects.filter(user=learner).aggregate(avg=Avg('completion_percent'))['avg'] or 0.0
            
            # 2. Quiz Progress
            quiz_avg = QuizAttempt.objects.filter(user=learner).aggregate(avg=Avg('score'))['avg'] or 0.0
            
            # 3. Assignment Progress
            modules_with_assignments = Module.objects.filter(has_assignment=True).count() or 1
            completed_assignments = Assignment.objects.filter(user=learner, status='completed').count()
            assignment_avg = (completed_assignments / modules_with_assignments) * 100
            
            # 4. Total Time
            total_seconds = LearningSession.objects.filter(user=learner).aggregate(total=Sum('total_seconds'))['total'] or 0
            
            # 5. Overall Calculation
            overall = (0.4 * video_avg) + (0.3 * quiz_avg) + (0.3 * assignment_avg)
            overall = min(100.0, max(0.0, overall))

            # 6. Status Calculation (Active/Slow/Stuck/Offline)
            last_session = LearningSession.objects.filter(user=learner).order_by('-last_ping_at').first()
            is_active = False
            if last_session:
                # Active if pinged in last 5 minutes
                if (timezone.now() - last_session.last_ping_at).total_seconds() < 300:
                    is_active = True

            if is_active:
                status_str = 'active'
            elif overall > 0 and overall < 30:
                status_str = 'stuck'
            elif overall >= 30 and overall < 50:
                status_str = 'slow'
            else:
                status_str = 'offline'

            # Health Color
            if overall >= 70: health = 'GREEN'
            elif overall >= 40: health = 'ORANGE'
            else: health = 'RED'

            # Format time string
            hours = int(total_seconds // 3600)
            minutes = int((total_seconds % 3600) // 60)
            time_str = f"{hours}h {minutes}m"

            data.append({
                'id': learner.id,
                'name': learner.username, 
                'email': learner.email,
                'progress': round(overall, 1),
                'time_invested': time_str,
                'video_score': round(video_avg, 1),
                'quiz_score': round(quiz_avg, 1),
                'assignment_score': round(assignment_avg, 1),
                'health': health,
                'status': status_str,
                'rank': 0 # Frontend can handle ranking
            })

        # Sort by progress desc
        data.sort(key=lambda x: x['progress'], reverse=True)
        for i, item in enumerate(data):
            item['rank'] = i + 1

        return Response(data)

from apps.learner_progress.models import LearnerModuleProgress

class ManagerWeekProgressView(APIView):
    """
    Control Tower 2.0: Dynamic Week-wise Aggregation.
    Formula: 
    - video_progress = (completed_videos_in_week / total_videos_in_week) * 100
    - quiz_progress = (passed_quizzes_in_week / total_quizzes_in_week) * 100
    - week_progress = (video_progress + quiz_progress) / 2
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['manager', 'admin', 'oversight']:
            return Response({'error': 'Unauthorized'}, status=403)

        learners = User.objects.filter(role='learner').order_by('id')
        active_modules = Module.objects.filter(is_active=True)
        
        # Pre-group modules by week for efficiency
        weeks_modules = {w: active_modules.filter(week=w) for w in range(1, 5)}
        weeks_total = {w: weeks_modules[w].count() for w in range(1, 5)}
        
        data = []
        for learner in learners:
            learner_data = {
                'id': learner.id,
                'name': learner.username,
                'email': learner.email,
            }
            
            weeks_scores = []
            for w in range(1, 5):
                total_in_week = weeks_total[w]
                if total_in_week == 0:
                    learner_data[f'week{w}'] = {'progress': 0, 'color': 'red'}
                    weeks_scores.append(0)
                    continue
                
                # 1. Video Progress
                # A video is "completed" if LearnerModuleProgress.is_video_completed is True
                completed_videos = LearnerModuleProgress.objects.filter(
                    user=learner,
                    module__week=w,
                    module__is_active=True,
                    is_video_completed=True
                ).count()
                video_progress = (completed_videos / total_in_week) * 100
                
                # 2. Quiz Progress
                # A quiz is "passed" if score >= 80 for any attempt on a module in that week
                # Count modules in the week that have a passed attempt
                passed_quizzes = 0
                for mod in weeks_modules[w]:
                    if QuizAttempt.objects.filter(user=learner, quiz__module=mod, score__gte=80).exists():
                        passed_quizzes += 1
                
                quiz_progress = (passed_quizzes / total_in_week) * 100
                
                # 3. Final Week Progress
                week_progress = (video_progress + quiz_progress) / 2
                
                # Color logic
                if week_progress >= 70: color = 'green'
                elif week_progress >= 40: color = 'orange'
                else: color = 'red'
                
                learner_data[f'week{w}'] = {
                    'progress': round(week_progress, 1),
                    'color': color
                }
                weeks_scores.append(week_progress)
            
            # Overall score = average of all 4 weeks
            overall = sum(weeks_scores) / 4
            learner_data['overall'] = round(overall, 1)
            data.append(learner_data)
            
        # Ranking Logic: Sort by overall desc
        data.sort(key=lambda x: x['overall'], reverse=True)
        for i, item in enumerate(data):
            item['rank'] = i + 1
            
        return Response(data)

class ManagerLearnerDetailsView(APIView):
    """
    Drill-down API: Returns detailed analytics for a specific learner.
    Includes: Weekly Mastery, Recent Activity, Module Breakdown.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.role not in ['manager', 'admin', 'oversight']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        try:
            learner = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Learner not found'}, status=404)

        # 1. Weekly Mastery (Last 4 weeks)
        today = timezone.now()
        weekly_mastery = []
        for i in range(4):
            start_date = today - timedelta(days=(i+1)*7)
            end_date = today - timedelta(days=i*7)
            
            # Calculate activity in this week
            # For simplicity, let's sum session time in this week
            seconds = LearningSession.objects.filter(
                user=learner, 
                last_ping_at__range=(start_date, end_date)
            ).aggregate(total=Sum('total_seconds'))['total'] or 0
            
            # Normalize to some score (e.g. 5 hours = 100%)
            score = min(100, (seconds / (5 * 3600)) * 100)
            
            weekly_mastery.append({
                'week': f"Week {4-i}", 
                'score': round(score, 1),
                'label': f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d')}"
            })
        weekly_mastery.reverse()

        # 2. Recent Activity
        recent_sessions = LearningSession.objects.filter(user=learner).order_by('-last_ping_at')[:5]
        recent_activity = []
        for session in recent_sessions:
            recent_activity.append({
                'id': session.id,
                'module': session.module.title,
                'action': 'Learning Session',
                'time': session.last_ping_at.strftime('%Y-%m-%d %H:%M'),
                'duration': f"{session.total_seconds // 60}m"
            })

        # 3. Module Breakdown
        modules = Module.objects.all()
        module_breakdown = []
        for module in modules:
            vp = VideoProgress.objects.filter(user=learner, module=module).first()
            qa = QuizAttempt.objects.filter(user=learner, quiz__module=module).order_by('-score').first()
            assn = Assignment.objects.filter(user=learner, module=module).first()
            
            module_breakdown.append({
                'id': module.id,
                'title': module.title,
                'video_progress': round(vp.completion_percent, 1) if vp else 0,
                'quiz_score': qa.score if qa else 0,
                'assignment_status': assn.status if assn else 'Pending'
            })

        return Response({
            'learner': {
                'id': learner.id,
                'name': learner.username,
                'email': learner.email,
                'role': learner.role
            },
            'weekly_mastery': weekly_mastery,
            'recent_activity': recent_activity,
            'module_breakdown': module_breakdown
        })

class VideoProgressUpdateView(APIView):
    """
    Telemetry Endpoint: updates video progress real-time.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        video_id = request.data.get('video_id')
        module_id = request.data.get('module_id')
        watched = float(request.data.get('watched_seconds', 0))
        total = float(request.data.get('total_seconds', 1))
        
        if not all([video_id, module_id]):
            return Response({'error': 'Missing data'}, status=400)

        percent = (watched / total) * 100
        percent = min(100.0, percent) # Cap at 100

        # Update VideoProgress
        vp, created = VideoProgress.objects.update_or_create(
            user=request.user,
            video_id=video_id,
            module_id=module_id,
            defaults={
                'watched_seconds': watched,
                'total_seconds': total,
                'completion_percent': percent
            }
        )

        return Response({'status': 'updated', 'percent': percent})

import logging
from django.db import transaction
from django.db.models import F

logger = logging.getLogger(__name__)

class SessionPingView(APIView):
    """
    Heartbeat Endpoint: increments active learning time.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        module_id = request.data.get('module_id')
        if not module_id:
            return Response({'error': 'Missing module_id'}, status=400)

        # Validate Module Existence
        if not Module.objects.filter(id=module_id).exists():
            return Response({'error': 'Module not found'}, status=404)

        try:
            with transaction.atomic():
                # 1. Fetch active sessions (handle duplicates)
                sessions = LearningSession.objects.filter(
                    user=request.user,
                    module_id=module_id,
                    status='active'
                ).select_for_update().order_by('-last_ping_at')

                if sessions.exists():
                    session = sessions.first()
                    
                    # Self-Healing: Close old duplicate sessions
                    if sessions.count() > 1:
                        logger.warning(f"Duplicate sessions found for user {request.user.id}, module {module_id}. Closing {sessions.count() - 1} duplicates.")
                        for dupe in sessions[1:]:
                            dupe.status = 'completed'
                            dupe.save()

                    # Atomic Increment
                    session.total_seconds = F('total_seconds') + 10
                    session.save()
                    
                    # Refresh to get updated value for response
                    session.refresh_from_db()
                else:
                    # Create new session if none exists
                    session = LearningSession.objects.create(
                        user=request.user,
                        module_id=module_id,
                        status='active',
                        total_seconds=0
                    )
                
                return Response({'status': 'pong', 'total': session.total_seconds})

        except Exception as e:
            logger.error(f"CRITICAL: Session Ping Failed for User {request.user.id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Internal Server Error', 'details': str(e)}, 
                status=500
            )

from config.celery import app as celery_app
from django.conf import settings
import redis
import requests
from apps.utils.supabase_storage import SupabaseStorage

class PipelineHealthView(APIView):
    """
    GET /analytics/system/health/
    Checks status of all pipeline components.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.role in ['admin', 'manager', 'oversight']:
             return Response({'error': 'Unauthorized'}, status=403)

        health_status = {
            "redis": "unknown",
            "celery": "unknown",
            "supabase": "unknown",
            "assemblyai": "unknown",
            "gemini": "unknown"
        }

        # 1. Check Redis
        try:
            r = redis.from_url(settings.CELERY_BROKER_URL)
            r.ping()
            health_status['redis'] = 'connected'
        except Exception as e:
            health_status['redis'] = f'disconnected: {str(e)}'

        # 2. Check Celery
        try:
            if settings.CELERY_TASK_ALWAYS_EAGER:
                 health_status['celery'] = 'eager_mode (active)'
            else:
                inspector = celery_app.control.inspect()
                # Check if we can reach any worker
                stats = inspector.stats()
                if stats:
                    health_status['celery'] = f'active ({len(stats)} nodes)'
                else:
                    health_status['celery'] = 'inactive (no workers found)'
        except Exception as e:
            health_status['celery'] = f'error: {str(e)}'

        # 3. Check Supabase
        try:
            storage = SupabaseStorage()
            buckets = storage.client.storage.list_buckets()
            if buckets is not None:
                health_status['supabase'] = 'working'
            else:
                health_status['supabase'] = 'error (no response)'
        except Exception as e:
             health_status['supabase'] = f'failing: {str(e)}'

        # 4. Check AssemblyAI (Simple Auth Check)
        try:
            headers = {"authorization": settings.ASSEMBLYAI_API_KEY}
            resp = requests.get("https://api.assemblyai.com/v2/transcript?limit=1", headers=headers, timeout=5)
            if resp.status_code == 200:
                health_status['assemblyai'] = 'reachable'
            else:
                health_status['assemblyai'] = f'error: {resp.status_code}'
        except Exception as e:
            health_status['assemblyai'] = f'unreachable: {str(e)}'

        # 5. Check Gemini
        try:
            if settings.GOOGLE_GEMINI_API_KEY:
                 health_status['gemini'] = 'configured'
            else:
                 health_status['gemini'] = 'missing_key'
        except:
             health_status['gemini'] = 'error'

        return Response(health_status)
