import os
import google.generativeai as genai
import json
import logging
import time
import requests
import yt_dlp
from django.conf import settings
from rest_framework.exceptions import ValidationError
from .schemas import AIResponseSchema

logger = logging.getLogger(__name__)

# --- Configuration ---
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')
GOOGLE_GEMINI_API_KEY = os.getenv('GOOGLE_GEMINI_API_KEY')

# Configure Gemini
if GOOGLE_GEMINI_API_KEY:
    genai.configure(api_key=GOOGLE_GEMINI_API_KEY)
else:
    logger.warning("GOOGLE_GEMINI_API_KEY not found in environment variables")

def transcribe_video(video_url):
    """
    Transcribes a video URL using AssemblyAI with production hardening.
    timeout=60s for requests.
    """
    logger.info(f"Starting transcription for: {video_url}")
    
    headers = {
        "authorization": ASSEMBLYAI_API_KEY,
        "content-type": "application/json"
    }
    
    # Standard Request Timeout
    TIMEOUT = 60

    # 1. Upload to AssemblyAI (if it's a file or local download)
    actual_url = video_url
    
    # Check if it is a Youtube URL
    if "youtube.com" in video_url or "youtu.be" in video_url:
        logger.info(f"Downloading audio from YouTube: {video_url}")
        
        # Download audio using yt-dlp (Prefer m4a for compatibility)
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/best',
            'outtmpl': os.path.join(settings.BASE_DIR, 'temp_%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=True)
                filename = ydl.prepare_filename(info)
                audio_file = filename
                
                logger.info(f"Audio downloaded to: {audio_file}")
                
            # Upload the local file
            logger.info("Uploading to AssemblyAI...")
            def read_file(file_path):
                with open(file_path, 'rb') as f:
                    while True:
                        data = f.read(5242880)
                        if not data:
                            break
                        yield data
            
            upload_response = requests.post(
                'https://api.assemblyai.com/v2/upload',
                headers=headers,
                data=read_file(audio_file),
                timeout=TIMEOUT
            )
            upload_response.raise_for_status()
            actual_url = upload_response.json()['upload_url']
            
            # Clean up temp file
            if os.path.exists(audio_file):
                os.remove(audio_file)
                logger.info(f"Deleted temp file: {audio_file}")

        except Exception as e:
            logger.error(f"YouTube Download/Upload Failed: {e}")
            raise ValidationError(f"Failed to process YouTube video: {str(e)}")

    # 2. Start Transcription
    logger.info(f"Transcribing {actual_url}...")
    transcript_endpoint = "https://api.assemblyai.com/v2/transcript"
    json_data = {
        "audio_url": actual_url,
        "speech_models": ["universal-2"]
    }

    try:
        response = requests.post(transcript_endpoint, json=json_data, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"AssemblyAI Submit Error: {e}")
        raise e
        
    transcript_id = response.json()['id']
    logger.info(f"Transcription ID: {transcript_id}")

    # 3. Poll for Completion with Timeout Protection
    polling_endpoint = f"{transcript_endpoint}/{transcript_id}"
    max_polls = 100 # Approx 5 mins
    
    for _ in range(max_polls):
        try:
            transcription_result = requests.get(polling_endpoint, headers=headers, timeout=TIMEOUT).json()
            status = transcription_result['status']

            if status == 'completed':
                logger.info("Transcription Completed Successfully")
                return transcription_result['text']
            elif status == 'error':
                logger.error(f"AssemblyAI Failed: {transcription_result['error']}")
                raise Exception(f"Transcription failed: {transcription_result['error']}")
            
            time.sleep(3)
        except Exception as poll_err:
             logger.warning(f"Polling Error (retrying): {poll_err}")
             time.sleep(3)
             
    raise TimeoutError("Transcription timed out after 5 minutes")


def generate_quiz_and_assignment(transcript_text):
    """
    Generates 5 questions and 1 assignment using Google Gemini.
    Features: Robust Error Handling, Retry Logic, Strict JSON parsing.
    """
    if not GOOGLE_GEMINI_API_KEY:
         raise ValueError("Google Gemini API Key is missing.")

    logger.info(f"Generating AI Content (Length: {len(transcript_text)})")
    
    prompt = f"""
    You are an LMS AI assistant.
    Analyze the following video transcript and generate assessment materials.
    
    TRANSCRIPT:
    {transcript_text[:25000]}... (truncated)

    TASK:
    1. Generate 5 multiple choice questions (4 options each, correct_option must be "A", "B", "C", or "D").
    2. Generate 1 assignment task (title and description).

    OUTPUT FORMAT:
    Strictly return a valid JSON object. Do not include markdown formatting (```json).
    
    JSON SCHEMA:
    {{
      "questions": [
        {{
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_option": "A" 
        }}
      ],
      "assignment": {{
          "title": "Assignment Title",
          "description": "Detailed assignment description based on the transcript."
      }}
    }}
    """

    candidate_models = [
        'models/gemini-2.0-flash', 
        'models/gemini-flash-latest', 
        'models/gemini-2.0-flash-lite',
        'models/gemini-pro-latest'
    ]
    last_exception = None
    max_retries = 3
    
    for model_name in candidate_models:
        logger.info(f"Trying AI Model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name)
            
            for attempt in range(max_retries):
                try:
                    # Provide generation config for JSON if possible (Gemini 1.5+ feature, but let's stick to prompt eng for compat)
                    response = model.generate_content(prompt, request_options={'timeout': 60})
                    response_text = response.text
                    
                    # Robust Cleaning
                    cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
                    if "{" not in cleaned_text:
                        raise ValueError("Response does not contain JSON")
                        
                    # Parse JSON
                    data = json.loads(cleaned_text)
                    
                    # Validate with Pydantic
                    validated_data = AIResponseSchema(**data)
                    
                    logger.info(f"AI Generation Successful using {model_name}")
                    return validated_data.model_dump()
        
                except (json.JSONDecodeError, ValidationError) as e:
                    logger.warning(f"Attempt {attempt + 1} validation failed: {str(e)}")
                    last_exception = e
                    if attempt == max_retries - 1: raise e
                    time.sleep(1)
                except Exception as e:
                     err_str = str(e)
                     last_exception = e
                     logger.error(f"Error with {model_name}: {err_str}")
                     
                     if "404" in err_str or "not found" in err_str.lower():
                         break 
                     if "429" in err_str or "quota" in err_str.lower():
                         logger.warning(f"Quota exceeded for {model_name}. Waiting 60s before retry...")
                         time.sleep(60) 
                         continue 

                     if attempt == max_retries - 1: continue # Try next model
                     time.sleep(2)
            
        except Exception as e:
            last_exception = e
            logger.error(f"Model Init Error {model_name}: {e}")
            continue 
            
    # --- FALLBACK MECHANISM ---
    logger.error(f"⚠️ All AI models failed/quota exceeded. Using Fallback Content. Last error: {last_exception}")
    print("⚠️ Switching to Fallback Content Generation...")
    
    return {
        "questions": [
            {
                "question": "What is the primary topic of this video?",
                "options": ["The core subject matter", "Unrelated trivia", "Advanced calculus", "Cooking tips"],
                "correct_option": "A"
            },
            {
                "question": "Which key concept was discussed?",
                "options": ["Concept A", "Concept B", "Concept C", "Concept D"],
                "correct_option": "B"
            },
            {
                "question": "Navigate to the Learner Dashboard to track your:",
                "options": ["Health Index", "Stock Portfolio", "Weather", "Email"],
                "correct_option": "A"
            },
             {
                "question": "This module is part of which week?",
                "options": ["Week 1-4", "Week 52", "Week 99", "Week 0"],
                "correct_option": "A"
            },
             {
                "question": "To complete this module, you must:",
                "options": ["Watch the video", "Skip the video", "Close the tab", "Do nothing"],
                "correct_option": "A"
            }
        ],
        "assignment": {
            "title": "Reflection Task (Fallback)",
            "description": "Please summarize the key takeaways from the video you just watched in 100 words. (AI Generation was unavailable, this is a placeholder assignment)."
        }
    }
