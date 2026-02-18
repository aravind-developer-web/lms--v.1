from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from apps.modules.models import Module
from .models import LearnerModuleProgress
from .services import ProgressTrackingService
from .serializers import VideoProgressSerializer, QuizProgressSerializer, AssignmentProgressSerializer

class VideoProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VideoProgressSerializer(data=request.data)
        if serializer.is_valid():
            module_id = serializer.validated_data['module_id']
            video_percent = serializer.validated_data['progress_percent']
            
            with transaction.atomic():
                module = get_object_or_404(Module, id=module_id)
                progress, _ = LearnerModuleProgress.objects.get_or_create(user=request.user, module=module)
                
                # Rule: Never decrease progress
                if video_percent > progress.video_percent:
                    progress.video_percent = video_percent
                
                # Rule: Check completion (>= 95%)
                if video_percent >= 95.0:
                    progress.is_video_completed = True
                    progress.video_percent = 100.0 # Force 100 on completion
                
                progress.update_status() # Recalculate module status
                
            return Response({"status": "updated", "percent": progress.video_percent}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QuizProgressSerializer(data=request.data)
        if serializer.is_valid():
            module_id = serializer.validated_data['module_id']
            score_percent = serializer.validated_data['score_percent']
            passed = serializer.validated_data.get('passed', False)
            
            with transaction.atomic():
                module = get_object_or_404(Module, id=module_id)
                progress, _ = LearnerModuleProgress.objects.get_or_create(user=request.user, module=module)
                
                # Rule: Always take max score
                if score_percent > progress.quiz_percent:
                    progress.quiz_percent = score_percent
                
                if passed:
                    progress.is_quiz_completed = True
                
                progress.update_status()
                
            return Response({"status": "updated"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AssignmentProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AssignmentProgressSerializer(data=request.data)
        if serializer.is_valid():
            module_id = serializer.validated_data['module_id']
            
            with transaction.atomic():
                module = get_object_or_404(Module, id=module_id)
                progress, _ = LearnerModuleProgress.objects.get_or_create(user=request.user, module=module)
                
                progress.assignment_percent = 100.0
                progress.is_assignment_completed = True
                progress.update_status()
                
            return Response({"status": "updated"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LearnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Module has 'priority' field, not 'order'
        modules = Module.objects.filter(is_active=True).order_by('week', 'priority')
        
        # Prefetch progress
        progress_map = {
            p.module_id: p 
            for p in LearnerModuleProgress.objects.filter(user=user)
        }
        
        module_data = []
        completed_count = 0
        in_progress_count = 0
        
        for module in modules:
            p = progress_map.get(module.id)
            
            # Default values if no progress record
            vid_pct = p.video_percent if p else 0.0
            quiz_pct = p.quiz_percent if p else 0.0
            ass_pct = p.assignment_percent if p else 0.0
            mod_status = p.module_status if p else 'not_started'
            
            if mod_status == 'completed':
                completed_count += 1
            elif mod_status == 'in_progress':
                in_progress_count += 1
                
            module_data.append({
                "id": module.id,
                "title": module.title,
                "week": module.week,
                "video_percent": vid_pct,
                "quiz_percent": quiz_pct,
                "assignment_percent": ass_pct,
                "status": mod_status,
                "is_completed": mod_status == 'completed',
                # Required helpers for frontend
                "has_quiz": hasattr(module, 'quiz'),
                "has_assignment": hasattr(module, 'assignments') and module.assignments.exists(),
                "video_url": module.video_url,
                "description": module.description,
                "duration": module.duration,
                "is_quiz_locked": getattr(module, 'is_quiz_locked', False),
                "is_assignment_locked": getattr(module, 'is_assignment_locked', False)
            })
            
        total = len(modules)
        not_started = total - completed_count - in_progress_count
        completion_rate = (completed_count / total * 100) if total > 0 else 0
        
        # Calculate Averages for Health Score
        # Avoid division by zero
        sum_vid = sum(m['video_percent'] for m in module_data)
        sum_quiz = sum(m['quiz_percent'] for m in module_data)
        
        avg_video = sum_vid / total if total > 0 else 0
        avg_quiz = sum_quiz / total if total > 0 else 0
        
        health_score = (avg_video * 0.4) + (avg_quiz * 0.3) + (completion_rate * 0.3)
        
        return Response({
            "total_modules": total,
            "completed_modules": completed_count,
            "in_progress_modules": in_progress_count,
            "not_started_modules": not_started,
            "overall_completion_percent": round(completion_rate, 1),
            "health_score": round(health_score, 1),
            "health_status": "great_job" if health_score >= 80 else "good" if health_score >= 60 else "needs_attention",
            "modules": module_data
        })

# --- Legacy Views (Restored for Backward Compatibility) ---

class ProgressSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        summary = ProgressTrackingService.get_learner_summary(user)
        return Response(summary)

class ModuleProgressListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        modules = Module.objects.all()
        progress_data = []
        
        for module in modules:
            # We can use the sync service or just read DB. 
            # For legacy consistency, let's just read existing rows if possible, 
            # or use sync if we want to be safe. 
            # User wants "No manual hacks", so using the new system is better.
            # But these views are legacy.
            progress = ProgressTrackingService.sync_module_progress(user, module)
            progress_data.append({
                "module_id": module.id,
                "video_percent": progress.video_percent,
                "quiz_percent": progress.quiz_percent,
                "assignment_percent": progress.assignment_percent,
                "module_status": progress.module_status,
                "status": progress.module_status,
                "completion_percent": progress.video_percent,
                "is_completed": progress.module_status == 'completed'
            })
            
        return Response(progress_data)

class ModuleProgressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, module_id):
        user = request.user
        try:
            module = Module.objects.get(id=module_id)
            progress = ProgressTrackingService.sync_module_progress(user, module)
            
            return Response({
                "video_percent": progress.video_percent,
                "quiz_percent": progress.quiz_percent,
                "assignment_percent": progress.assignment_percent,
                "module_status": progress.module_status,
                "is_completed": progress.module_status == 'completed'
            })
        except Module.DoesNotExist:
            return Response({"error": "Module not found"}, status=404)
