from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Quiz, QuizAttempt, Question, Answer
from .serializers import QuizSerializer, QuizAttemptSerializer
from apps.progress.models import ModuleProgress

class QuizListView(generics.ListAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.all()

class QuizDetailView(generics.RetrieveAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'module_id'
    lookup_url_kwarg = 'module_id'

class QuizSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, module_id):
        quiz = get_object_or_404(Quiz, module_id=module_id)
        
        # --- SMART LOCK ENFORCEMENT ---
        # We use the ModuleSerializer logic but manual check for performance/specificity
        # Or better: check VideoEngagement directly
        from apps.analytics.models import VideoEngagement
        if request.user.role not in ['manager', 'admin']:
            try:
                engagement = VideoEngagement.objects.get(user=request.user, module_id=module_id)
                # Strict check: Must have 80% score
                if engagement.engagement_score < 0.8:
                    return Response({"detail": "Engagement too low. Please watch the video properly."}, status=403)
            except VideoEngagement.DoesNotExist:
                return Response({"detail": "Video not detected. Please watch the video first."}, status=403)
        # ------------------------------

        user_answers = request.data.get('answers', {})
        score = 0
        total_questions = quiz.questions.count()
        
        if total_questions == 0:
            return Response({'error': 'Quiz has no questions'}, status=status.HTTP_400_BAD_REQUEST)

        for q_id, a_id in user_answers.items():
            try:
                question = Question.objects.get(id=q_id, quiz=quiz)
                selected_answer = Answer.objects.get(id=a_id, question=question)
                if selected_answer.is_correct:
                    score += 1
            except:
                continue

        percentage = (score / total_questions) * 100
        passed = percentage >= quiz.passing_score

        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=percentage,
            passed=passed
        )

        if passed:
            progress, created = ModuleProgress.objects.get_or_create(
                user=request.user, 
                module_id=module_id
            )
            progress.status = 'completed'
            progress.save()

        return Response({
            'score': percentage,
            'passed': passed,
            'attempt_id': attempt.id
        })
