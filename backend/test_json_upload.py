import requests

def test_json_upload():
    print("Testing JSON Upload (YouTube URL)...")
    url = "http://localhost:8000/api/modules/stream/upload/"
    
    # Payload for JSON upload (no files)
    data = {
        "title": "JSON Upload Test",
        "url": "https://youtu.be/testvideo",
        "week": 1,
        "video": None # Explicitly null or omitted
    }
    
    headers = {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000" 
    }
    
    # Fake a token? We might get 401, but we want to check if we get 415.
    # If we get 401, it means the parser accepted the content type (JSON) and proceeded to auth.
    # If we get 415, the parser failed.
    
    try:
        resp = requests.post(url, json=data, headers=headers)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 415:
            print("❌ Failed: 415 Unsupported Media Type (JSONParser missing?)")
        elif resp.status_code == 401:
            print("✅ Success: Got 401 (Auth required) -> This means Content-Type was ACCEPTED.")
        elif resp.status_code == 200: # If we somehow bypass auth (unlikely)
            print("✅ Success: Upload worked.")
        else:
            print(f"⚠️ Unexpected Status: {resp.status_code}. Response: {resp.text}")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_json_upload()
