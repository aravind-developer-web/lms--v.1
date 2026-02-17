from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Assignment
from .serializers import AssignmentSerializer
from apps.modules.models import Module
from apps.progress.models import ModuleProgress

class AssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'manager':
            return Assignment.objects.all()
        return Assignment.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'manager':
            return Assignment.objects.all()
        return Assignment.objects.filter(user=user)

class AssignmentSubmitView(APIView):
    """
    Endpoint: /assignments/modules/{module_id}/submit/
    Allows learners to submit assignment content for a specific module.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, module_id):
        """Return existing submissions for this module"""
        try:
            module = get_object_or_404(Module, id=module_id)
            submissions = Assignment.objects.filter(
                user=request.user,
                module=module
            ).order_by('-submitted_at')
            
            data = [{
                'id': a.id,
                'content': a.content,
                'status': a.status,
                'submitted_at': a.submitted_at
            } for a in submissions]
            
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, module_id):
        """Submit assignment content"""
        # --- SMART LOCK ENFORCEMENT ---
        if request.user.role not in ['manager', 'admin']:
            module = get_object_or_404(Module, id=module_id)
            if module.has_quiz:
                from apps.quiz.models import QuizAttempt
                passed = QuizAttempt.objects.filter(
                    user=request.user, 
                    quiz__module_id=module_id, 
                    passed=True # Using passed flag directly
                ).exists()
                if not passed:
                     return Response({"detail": "Quiz not passed. Assignment locked."}, status=403)
        # ------------------------------

        try:
            module = get_object_or_404(Module, id=module_id)
            content = request.data.get('content', '')
            
            if not content.strip():
                return Response(
                    {'error': 'Assignment content cannot be empty'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create or update assignment
            assignment, created = Assignment.objects.update_or_create(
                user=request.user,
                module=module,
                defaults={
                    'content': content,
                    'status': 'completed',
                    'submitted_at': timezone.now()
                }
            )

            # Update ModuleProgress to 'completed'
            progress, _ = ModuleProgress.objects.get_or_create(
                user=request.user,
                module=module
            )
            if progress.status != 'completed':
                progress.status = 'completed'
                progress.completed_at = timezone.now()
                progress.save()

            return Response({
                'status': 'success',
                'assignment_id': assignment.id,
                'message': 'Assignment submitted successfully'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
