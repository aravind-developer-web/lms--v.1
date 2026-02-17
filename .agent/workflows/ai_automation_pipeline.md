---
description: Automated workflow for processing video uploads into quizzes and assignments
---

# AI Automation Pipeline Workflow

1.  **Trigger**: Manager uploads a video file or provides a YouTube URL via the Dashboard or API.
2.  **Backend Hook**: `ModuleViewSet.perform_create` or `perform_update` intercepts the save.
3.  **Task Queue**: `process_module_content.delay(module_id)` is called to queue a Celery task.
4.  **Async Processing (Celery)**:
    *   **Step 1**: `transcribe_video` (AssemblyAI) generates text from audio.
    *   **Step 2**: `generate_quiz_and_assignment` (Gemini) creates structured content.
    *   **Step 3**: Database records (`Quiz`, `AssignmentQuestion`, `Module`) are created/updated atomically.
5.  **Completion**: Module `processing_status` updates to 'completed'.

## Key Files
*   `backend/apps/modules/views.py`: Trigger logic.
*   `backend/apps/ai_engine/tasks.py`: Orchestration logic.
*   `backend/apps/ai_engine/services.py`: Integration logic (AssemblyAI + Gemini).

// turbo
3. Run `python manage.py test apps.ai_engine` to verify pipeline components.
