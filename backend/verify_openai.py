import os
import django
import sys
import time

# Load .env file manually
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai_engine.services import generate_quiz_and_assignment

def verify_openai():
    print("Starting OpenAI Integration Verification...")
    
    # Mock Transcript
    transcript = """
    Artificial Intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by humans or animals. 
    Leading AI textbooks define the field as the study of "intelligent agents": any system that perceives its environment and takes actions that maximize its chance of achieving its goals.
    Some popular accounts use the term "artificial intelligence" to describe machines that mimic "cognitive" functions that humans associate with the human mind, such as "learning" and "problem solving".
    As machines become increasingly capable, tasks considered to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI effect. 
    A quip in Tesler's Theorem says "AI is whatever hasn't been done yet."
    For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology.
    """
    
    try:
        print("Calling generate_quiz_and_assignment with OpenAI...")
        start_time = time.time()
        result = generate_quiz_and_assignment(transcript)
        end_time = time.time()
        
        print(f"Success! Duration: {round(end_time - start_time, 2)}s")
        print("\nGenerated Data:")
        print(f"Questions: {len(result['questions'])}")
        print(f"Assignment Title: {result['assignment']['title']}")
        print(f"Assignment Description: {result['assignment']['description']}")
        
        # Verify Structure
        if len(result['questions']) == 5 and result['assignment']['title']:
            print("\nVerification PASSED: OpenAI returned valid structure.")
        else:
            print("\nVerification FAILED: Invalid structure.")
            
    except Exception as e:
        print(f"\nVerification FAILED: {str(e)}")

if __name__ == '__main__':
    verify_openai()
