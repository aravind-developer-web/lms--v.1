from celery import shared_task
from django.db import transaction
from django.conf import settings
from apps.modules.models import Module
from apps.quiz.models import Quiz, Question, Answer
from apps.assignments.models import AssignmentQuestion
from apps.ai_engine.models import AILog
from .services import transcribe_video, generate_quiz_and_assignment
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_module_content(self, module_id):
    """
    Async task to process video content:
    1. Transcribe video
    2. Generate Quiz & Assignment
    3. Save to DB
    Uses exponential backoff for retries.
    Tracks usage in AILog.
    """
    logger.info(f"AI TASK STARTED: Module {module_id}")
    try:
        module = Module.objects.get(id=module_id)
        
        # Determine Video Source
        video_url = None
        if module.video_file:
            video_url = module.video_file.url
            logger.info(f"📂 Processing Video File: {video_url}")
        elif module.video_url:
            video_url = module.video_url
            logger.info(f"🔗 Processing Video URL: {video_url}")
        
        # --- Step 1: Transcription ---
        if not module.transcript:
            logger.info(f"Step 1: Transcribing Module {module_id}")
            module.processing_status = 'transcribing'
            module.save()
            
            transcript_log = AILog.objects.create(module=module, stage='transcription', status='processing')
            try:
                transcript = transcribe_video(video_url)
                transcript_log.status = 'success'
                transcript_log.save()
                module.transcript = transcript
                module.save()
                logger.info("Transcription Complete")
            except Exception as e:
                transcript_log.status = 'failure'
                transcript_log.error_message = str(e)
                transcript_log.save()
                raise e
        else:
            logger.info(f"Skipping transcription (already exists)")
            transcript = module.transcript

        # --- Step 2: Generation ---
        if not module.ai_generated_data:
            logger.info(f"Step 2: Generating Quiz/Assignment for Module {module_id}")
            module.processing_status = 'generating_content'
            module.save()
            
            generation_log = AILog.objects.create(module=module, stage='generation', status='processing')
            try:
                ai_data = generate_quiz_and_assignment(transcript)
                generation_log.status = 'success'
                generation_log.save()
                module.ai_generated_data = ai_data
                module.save()
                logger.info("AI Generation Complete")
            except Exception as e:
                generation_log.status = 'failure'
                generation_log.error_message = str(e)
                generation_log.save()
                raise e
        else:
            logger.info(f"Skipping generation (already exists)")
            ai_data = module.ai_generated_data

        # --- Step 3: Atomic DB Save ---
        logger.info(f"Step 3: Saving to Database (Atomic)")
        try:
            with transaction.atomic():
                # Clear existing content
                if hasattr(module, 'quiz'):
                    module.quiz.delete()
                
                # --- QUIZ CREATION ---
                questions_data = ai_data.get('questions', [])
                logger.info(f"   - Found {len(questions_data)} Questions")
                
                if questions_data:
                    # Create Parent Quiz
                    quiz = Quiz.objects.create(
                        module=module,
                        title=f"Quiz: {module.title}",
                        passing_score=70
                    )
                    
                    for i, q_data in enumerate(questions_data):
                        # Create Question
                        question = Question.objects.create(
                            quiz=quiz,
                            text=q_data.get('question', 'Untitled Question'),
                            order=i
                        )
                        
                        # Create Answers
                        options = q_data.get('options', [])
                        correct_option_char = q_data.get('correct_option', 'A').upper()
                        
                        # Map 'A', 'B', 'C', 'D' to index 0, 1, 2, 3
                        correct_index = -1
                        if correct_option_char == 'A': correct_index = 0
                        elif correct_option_char == 'B': correct_index = 1
                        elif correct_option_char == 'C': correct_index = 2
                        elif correct_option_char == 'D': correct_index = 3
                        
                        for idx, opt_text in enumerate(options):
                            Answer.objects.create(
                                question=question,
                                text=opt_text,
                                is_correct=(idx == correct_index)
                            )
                            
                    module.has_quiz = True

                # --- ASSIGNMENT CREATION ---
                assignment_data = ai_data.get('assignment')
                
                if assignment_data and isinstance(assignment_data, dict):
                    # Save to Module's assignment_prompt field (Frontend uses this)
                    module.assignment_prompt = assignment_data.get('description', '')
                    module.has_assignment = True
                    logger.info("   Assignment Prompt Saved to Module")
                else:
                    logger.warning("   Assignment data missing or invalid")

                # Final Status Update
                module.processing_status = 'completed'
                module.error_message = None # Clear any previous errors
                module.save()
                
            logger.info(f"Task Completed Successfully for Module {module_id}")

        except Exception as db_err:
             logger.error(f"Database Transaction Failed: {db_err}")
             raise db_err

    except Exception as e:
        logger.error(f"FATAL ERROR in Process Module {module_id}: {str(e)}")
        
        # Use a separate block to save error state to ensure it persists even if logic fails
        try:
            module = Module.objects.get(id=module_id)
            module.processing_status = 'failed'
            module.error_message = f"Pipeline Failed: {str(e)}"
            module.save()
        except Exception as save_err:
            logger.error(f"Failed to save error state: {save_err}")
            
        # Re-raise to let Celery know it failed (trigger retry)
        raise e
