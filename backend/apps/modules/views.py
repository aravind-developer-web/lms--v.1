from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Module, Resource
from .serializers import ModuleSerializer, ResourceSerializer, ResourceCreateSerializer

# form .tasks import process_module_content (Removed from top)

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import logging

logger = logging.getLogger(__name__)

class StreamView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        if request.user.role not in ['manager', 'admin']:
            return Response({"error": "Unauthorized: Only Managers can broadcast streams."}, status=403)

        title = request.data.get('title')
        url = request.data.get('url')
        week = request.data.get('week', 4)

        if not title or not url:
            return Response({"error": "Title and URL are required"}, status=400)
            
        try:
            week = int(week)
            if week < 1 or week > 4:
                return Response({"error": "Week must be between 1 and 4"}, status=400)
        except ValueError:
             return Response({"error": "Invalid week format"}, status=400)

        try:
            video_file = request.FILES.get('video')
            video_url = request.data.get('url') # Determine if URL or File
            
            final_video_url = video_url
            
            # --- SUPABASE UPLOAD ---
            if video_file:
                try:
                    from apps.utils.supabase_storage import SupabaseStorage
                    from django.utils.text import slugify
                    import uuid
                    
                    storage = SupabaseStorage()
                    
                    # Construct Structured Path
                    # Format: weeks/week_4/live-stream-title/filename.ext
                    ext = video_file.name.split('.')[-1]
                    clean_title = slugify(title)
                    filename = f"{clean_title}-{uuid.uuid4().hex[:6]}.{ext}"
                    path = f"weeks/week_{week}/{clean_title}/{filename}"
                    
                    final_video_url = storage.upload_file(video_file, destination_path=path)
                    print(f"Supabase Upload Success: {final_video_url}")
                except Exception as upload_err:
                     return Response({"error": f"Video Upload Failed: {str(upload_err)}"}, status=500)
            
            if not final_video_url:
                 return Response({"error": "Video URL or File is required"}, status=400)

            # Determine type
            resource_type = 'video'
            if 'youtube' in (final_video_url or '') or 'vimeo' in (final_video_url or ''):
                resource_type = 'video'
            elif video_file: 
                resource_type = 'video' # File uploads are videos

            module = Module.objects.create(
                title=f"Broadcast: {title}",
                description="Live stream broadcast from Control Tower.",
                week=week, 
                duration=30, 
                difficulty='advanced',
                video_url=final_video_url,
                processing_status='pending'
            )

            Resource.objects.create(
                module=module,
                title=title,
                type=resource_type,
                url=final_video_url,
                order=0
            )
            
            # Trigger AI Pipeline (Lazy Import to prevent circular ref)
            from apps.ai_engine.tasks import process_module_content
            try:
                task = process_module_content.delay(module.id)
                logger.info(f"AI Task Queued: {task.id}")
                ai_status = "queued"
            except Exception as e:
                logger.error(f"CELERY ERROR: Could not queue task: {e}")
                ai_status = "failed_to_queue"

            # Return 202 Accepted (Async Processing)
            return Response({
                "status": "processing", 
                "module_id": module.id,
                "task_id": task.id if 'task' in locals() else None,
                "message": "Upload successful. AI processing started in background."
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"STREAM UPLOAD ERROR: {e}")
            return Response({"error": f"Internal Error: {str(e)}"}, status=500)

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all().order_by('week', 'id')
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.video_url or instance.video_file:
            # Trigger AI Pipeline
            from apps.ai_engine.tasks import process_module_content
            try:
                process_module_content.delay(instance.id)
                print(f"AI Task Queued for Module {instance.id}")
            except Exception as e:
                print(f"CELERY ERROR: Could not queue task: {e}")

    def perform_update(self, serializer):
        instance = serializer.save()
        # If video changed, re-trigger? For now, let's trigger if present and not processed or requested.
        # Simple logic: Trigger if video exists. Task handles idempotency via check.
        if instance.video_url or instance.video_file:
             from apps.ai_engine.tasks import process_module_content
             try:
                process_module_content.delay(instance.id)
             except Exception as e:
                print(f"CELERY ERROR: Could not queue task: {e}")

    from rest_framework.decorators import action
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        GET /api/modules/{id}/status/
        Returns real-time granular processing status.
        """
        module = self.get_object()
        return Response({
            "id": module.id,
            "processing_status": module.processing_status, # pending | transcribing | generating_content | completed | failed
            "error_message": module.error_message,
            "has_transcript": bool(module.transcript),
            "quiz_count": module.quiz.questions.count() if hasattr(module, 'quiz') else 0,
            "has_assignment": module.has_assignment,
            "assignment_title": module.assignment_prompt if module.has_assignment else None
        })

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

class ModuleListCreateView(generics.ListCreateAPIView):
    queryset = Module.objects.all().order_by('-created_at')
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role in ['manager', 'admin']:
            serializer.save()
        else:
            raise permissions.PermissionDenied("Unauthorized")

class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

class ResourceCreateView(generics.CreateAPIView):
    serializer_class = ResourceCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        module_id = self.kwargs['module_id']
        if self.request.user.role in ['manager', 'admin']:
            serializer.save(module_id=module_id)
        else:
            raise permissions.PermissionDenied("Unauthorized")
