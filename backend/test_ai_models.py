import os
import sys
import google.generativeai as genai
import requests
from dotenv import load_dotenv

# Load Environment
load_dotenv('.env')

GEMINI_KEY = os.getenv('GOOGLE_GEMINI_API_KEY')
ASSEMBLY_KEY = os.getenv('ASSEMBLYAI_API_KEY')

def test_gemini():
    print("\n--- Testing Google Gemini ---")
    if not GEMINI_KEY:
        print("[FAIL] Gemini Key Missing")
        return

    genai.configure(api_key=GEMINI_KEY)
    
    # List available models
    print("Available Models:")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"[ERROR] Listing models failed: {e}")

    models_to_test = ['gemini-1.5-flash', 'gemini-pro', 'models/gemini-pro'] 
    
    for model_name in models_to_test:
        print(f"Testing Model: {model_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'AI Online' if you can hear me.")
            print(f"[SUCCESS] {model_name}: Response: {response.text.strip()}")
            return
        except Exception as e:
            print(f"[FAIL] {model_name} Failed: {e}")

def test_assemblyai():
    print("\n--- Testing AssemblyAI ---")
    if not ASSEMBLY_KEY:
        print("[FAIL] AssemblyAI Key Missing")
        return

    headers = {
        "authorization": ASSEMBLY_KEY,
        "content-type": "application/json"
    }
    
    try:
        response = requests.get("https://api.assemblyai.com/v2/transcript", headers=headers)
        
        if response.status_code == 200:
             print("[SUCCESS] AssemblyAI Auth Success")
        elif response.status_code == 401:
             print("[FAIL] AssemblyAI Key Rejected (401)")
        else:
             print(f"[WARN] AssemblyAI Connected but returned {response.status_code}")

    except Exception as e:
        print(f"[FAIL] Connection Error: {e}")

if __name__ == "__main__":
    test_gemini()
    test_assemblyai()
