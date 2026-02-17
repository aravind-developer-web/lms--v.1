from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from apps.modules.models import Module
from .tasks import process_module_content

from .serializers import ModuleUploadSerializer

class UploadModuleView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        serializer = ModuleUploadSerializer(data=request.data)
        if serializer.is_valid():
            try:
                module = serializer.save(processing_status='pending')
                
                # Trigger Celery Task
                process_module_content.delay(module.id)
                
                return Response({
                    "message": "Module created successfully. AI processing started.",
                    "module_id": module.id,
                    "status": "pending"
                }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response(
                    {"error": f"Internal Server Error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
