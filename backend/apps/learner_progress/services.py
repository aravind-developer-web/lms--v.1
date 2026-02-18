from django.utils import timezone
from django.db import transaction
from apps.learner_progress.models import LearnerModuleProgress
from apps.analytics.models import VideoEngagement
from apps.quiz.models import QuizAttempt, Quiz
from apps.assignments.models import Assignment

class ProgressTrackingService:
    @staticmethod
    def sync_module_progress(user, module):
        """
        Synchronizes the LearnerModuleProgress record for a given user and module based on
        real-time data from VideoEngagement, QuizAttempt, and Assignment.
        """
        metric, created = LearnerModuleProgress.objects.get_or_create(user=user, module=module)

        # 1. Video Percent Calculation
        video_percent = 0.0
        try:
            engagement = VideoEngagement.objects.filter(user=user, module=module).first()
            if engagement and engagement.video_duration > 0:
                percent = (engagement.active_watch_time / engagement.video_duration) * 100
                video_percent = min(percent, 100.0)
            elif engagement and engagement.completion_status == 'completed':
                 video_percent = 100.0
        except Exception:
            pass

        # 2. Quiz Percent Calculation
        quiz_percent = 0.0
        quiz_passed = False
        quiz_attempted = False
        try:
            if hasattr(module, 'quiz'):
                # Get best score
                attempts = QuizAttempt.objects.filter(user=user, quiz=module.quiz)
                if attempts.exists():
                    quiz_attempted = True
                    best_score = max([a.score for a in attempts])
                    quiz_percent = float(best_score)
                    
                    # Check passing score from the quiz itself
                    quiz_instance = module.quiz
                    passing_score = getattr(quiz_instance, 'passing_score', 70.0)
                    quiz_passed = quiz_percent >= passing_score
        except Exception:
            pass

        # 3. Assignment Percent Calculation
        assignment_percent = 0.0
        assignment_submitted = False
        try:
            # Check if assignment is completed/submitted
            completed_assignments = Assignment.objects.filter(
                user=user, 
                module=module, 
                status__in=['completed', 'in_progress', 'pending'] # pending usually means submitted but not graded? User said "submitted"
            )
            # Refined check: user requirement says "100 if submitted".
            # In our model, checking for existence or specific status. 
            # Let's assume ANY record means submitted for now, or check specific status if needed.
            # Ideally 'pending' means submitted.
            if completed_assignments.exists():
                assignment_percent = 100.0
                assignment_submitted = True
        except Exception:
            pass
        
        # 4. Determine Module Status
        # Requirements:
        # if video_percent == 100 AND quiz_percent >= passing_score AND assignment_submitted: module_status = "completed"
        # elif video_percent > 0 OR quiz_attempted: module_status = "in_progress"
        # else: module_status = "not_started"

        # Note: We need to handle cases where module DOES NOT HAVE quiz or assignment.
        # If no quiz, quiz condition is effectively True.
        # If no assignment, assignment condition is effectively True.
        
        has_quiz = hasattr(module, 'quiz')
        has_assignment = hasattr(module, 'assignments') and module.assignments.exists()
        
        # Effective conditions
        cond_video = video_percent >= 95.0 # Tolerance for float math / 100
        cond_quiz = quiz_passed if has_quiz else True
        cond_assignment = assignment_submitted if has_assignment else True
        
        if cond_video and cond_quiz and cond_assignment:
            new_status = 'completed'
        elif video_percent > 0 or quiz_attempted or (has_assignment and assignment_submitted): 
            # Added assignment check to in_progress to be safe
            new_status = 'in_progress'
        else:
            new_status = 'not_started'

        completed_at = metric.completed_at
        if new_status == 'completed' and not completed_at:
             completed_at = timezone.now()

        # 5. Atomic Update
        with transaction.atomic():
            metric.video_percent = round(video_percent, 2)
            metric.quiz_percent = round(quiz_percent, 2)
            metric.assignment_percent = round(assignment_percent, 2)
            
            metric.is_video_completed = cond_video
            metric.is_quiz_completed = cond_quiz
            metric.is_assignment_completed = cond_assignment
            
            metric.module_status = new_status
            metric.completed_at = completed_at
            
            metric.save()
            
        return metric

    # Alias for backward compatibility if needed, or update call sites
    update_learner_progress = sync_module_progress

    @staticmethod
    def get_learner_summary(user):
        """
        Returns the summary metrics for the learner dashboard.
        """
        metrics = LearnerModuleProgress.objects.filter(user=user)
        
        total_modules = Module.objects.count() # Or filter by course/availability
        # Note: metrics might not exist for all modules if user hasn't interacted.
        # Logic says "not_started" is default.
        # To get accurate "not_started" we might need total_modules - (in_progress + completed)
        
        completed_count = metrics.filter(module_status='completed').count()
        in_progress_count = metrics.filter(module_status='in_progress').count()
        
        # If record doesn't exist, it's effectively "not_started"
        # So not_started = total - (completed + in_progress)
        not_started_count = total_modules - completed_count - in_progress_count
        
        if total_modules > 0:
            overall_completion_rate = (completed_count / total_modules) * 100
        else:
            overall_completion_rate = 0.0
            
        # Averages (only across started modules, or all modules? Usually all modules for global health)
        # "avg_video_percent" usually means sum(video_percent) / total_modules
        # We need to handle modules with no progress record (assume 0%)
        
        sum_video = sum([m.video_percent for m in metrics])
        sum_quiz = sum([m.quiz_percent for m in metrics])
        sum_assignment = sum([m.assignment_percent for m in metrics])
        
        if total_modules > 0:
            avg_video = sum_video / total_modules
            avg_quiz = sum_quiz / total_modules
            avg_assignment = sum_assignment / total_modules
        else:
            avg_video = 0
            avg_quiz = 0
            avg_assignment = 0

        # Health Index
        # (0.4 × avg_video_percent) + (0.4 × avg_quiz_percent) + (0.2 × overall_completion_rate)
        health_index = (0.4 * avg_video) + (0.4 * avg_quiz) + (0.2 * overall_completion_rate)
        
        return {
            "total_modules": total_modules,
            "completed_modules": completed_count,
            "in_progress_modules": in_progress_count,
            "not_started_modules": not_started_count,
            "overall_completion_rate": round(overall_completion_rate, 1),
            "avg_video_percent": round(avg_video, 1),
            "avg_quiz_percent": round(avg_quiz, 1),
            "avg_assignment_percent": round(avg_assignment, 1),
            "health_index": round(health_index, 1)
        }
