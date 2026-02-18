from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer, MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        with open('auth_debug.log', 'a') as f:
            f.write(f"\\n--- NEW LOGIN ATTEMPT ---\\n")
            f.write(f"Headers: {request.headers}\\n")
            f.write(f"Data: {request.data}\\n")
            
        try:
            response = super().post(request, *args, **kwargs)
            with open('auth_debug.log', 'a') as f:
                f.write(f"Result: SUCCESS (200)\\n")
            return response
        except Exception as e:
            with open('auth_debug.log', 'a') as f:
                f.write(f"Result: FAILED ({str(e)})\\n")
            raise e

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class LearnerManagementView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['manager', 'admin']:
            return UserSerializer.Meta.model.objects.none()
        return UserSerializer.Meta.model.objects.filter(role='learner')

    def perform_create(self, serializer):
        # Default role for users created by managers is 'learner'
        serializer.save(role='learner')

class LearnerDeleteView(generics.DestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['manager', 'admin']:
            return UserSerializer.Meta.model.objects.none()
        return UserSerializer.Meta.model.objects.filter(role='learner')
