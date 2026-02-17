@echo off
echo ========================================================
echo        STARTING CELERY WORKER (ASYNC TASK ENGINE)
echo ========================================================
echo.
echo Ensuring Redis is running...
echo (If Redis is not installed, please run it via Docker: docker run -p 6379:6379 -d redis)
echo.
cd backend
echo Starting Worker...
celery -A config worker -l info -P solo
pause
