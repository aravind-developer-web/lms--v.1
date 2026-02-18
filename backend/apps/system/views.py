from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection
from django.conf import settings
from celery.app.control import Inspect
from config.celery import app as celery_app
import redis
import requests
import google.generativeai as genai
import traceback


class DeepPipelineHealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        report = {
            "database": "unknown",
            "redis": "unknown",
            "celery_worker": "unknown",
            "assemblyai": "unknown",
            "gemini": "unknown",
            "errors": []
        }

        # ---------------------
        # 1️⃣ Database Check
        # ---------------------
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            report["database"] = "ok"
        except Exception as e:
            report["database"] = "error"
            report["errors"].append(f"DB Error: {str(e)}")

        # ---------------------
        # 2️⃣ Redis Check
        # ---------------------
        try:
            host = getattr(settings, 'REDIS_HOST', None)
            port = getattr(settings, 'REDIS_PORT', None)
            
            if not host or not port:
                report["redis"] = "not_configured"
            else:
                r = redis.Redis(host=host, port=port, db=0, socket_timeout=5)
                r.ping()
                report["redis"] = "ok"
        except Exception as e:
            report["redis"] = "error"
            report["errors"].append(f"Redis Error: {str(e)}")

        # ---------------------
        # 3️⃣ Celery Worker Check
        # ---------------------
        try:
            inspect = Inspect(app=celery_app)
            active = inspect.active()
            if active:
                report["celery_worker"] = "ok"
            else:
                report["celery_worker"] = "no active worker"
        except Exception as e:
            report["celery_worker"] = "error"
            report["errors"].append(f"Celery Error: {str(e)}")

        # ---------------------
        # 4️⃣ AssemblyAI Check
        # ---------------------
        try:
            api_key = getattr(settings, 'ASSEMBLYAI_API_KEY', None)
            if not api_key:
                report["assemblyai"] = "not_configured"
            else:
                headers = {"authorization": api_key}
                response = requests.get(
                    "https://api.assemblyai.com/v2/transcript",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    report["assemblyai"] = "ok"
                else:
                    report["assemblyai"] = f"error ({response.status_code})"
        except Exception as e:
            report["assemblyai"] = "error"
            report["errors"].append(f"AssemblyAI Error: {str(e)}")

        # ---------------------
        # 5️⃣ Gemini Check
        # ---------------------
        try:
            api_key = getattr(settings, 'GEMINI_API_KEY', None)
            if not api_key:
                report["gemini"] = "not_configured"
            else:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-flash-latest")
                # Single token generation for speed
                test = model.generate_content("ping")
                if test:
                    report["gemini"] = "ok"
                else:
                    report["gemini"] = "no response"
        except Exception as e:
            report["gemini"] = "error"
            report["errors"].append(f"Gemini Error: {str(e)}")

        overall_status = "healthy"
        # Determine overall status based on critical services
        critical_services = ["database", "redis", "celery_worker"]
        if any(report[svc] == "error" for svc in critical_services):
            overall_status = "critical"
        elif "error" in report.values() or "not_configured" in report.values():
            overall_status = "degraded"

        return Response({
            "overall_status": overall_status,
            "details": report
        })
