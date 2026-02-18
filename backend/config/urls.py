from django.contrib import admin
from django.urls import path, include
from apps.modules.views import ManagerModuleView, ModuleRemoveView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core APIs
    path('api/auth/', include('apps.authapp.urls')),
    path('api/modules/', include('apps.modules.urls')),
    path('api/quiz/', include('apps.quiz.urls')),
    path('api/assignments/', include('apps.assignments.urls')),
    path('api/notes/', include('apps.notes.urls')),
    path('api/progress/', include('apps.progress.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/ai/', include('apps.ai_engine.urls')),
    path('api/learner-progress/', include('apps.learner_progress.urls')),

    # Manager Routes (inline – since you don't have apps.manager)
    path('api/manager/modules/', include([
        path('', ManagerModuleView.as_view(), name='manager-module-list'),
        path('<int:pk>/remove/', ModuleRemoveView.as_view(), name='manager-module-remove'),
    ])),

    # System Health
    path('api/system/', include('apps.system.urls')),
]
