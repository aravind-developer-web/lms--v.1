import requests
import os

def test_auth_endpoints():
    print("Testing Auth & Telemetry Endpoints...")
    
    # 1. Login to get token
    login_url = "http://localhost:8000/api/auth/login/"
    # We need a valid user. Assuming 'leader3' exists from screenshots or 'admin'.
    # I'll try a generic admin credential if possible, or skip if I don't have one.
    # The screenshot shows user 'leader3'. 
    
    # Since I don't have the password, I can't really test login fully.
    # But I can test the PROTECTION of the endpoint.
    
    telemetry_url = "http://localhost:8000/api/analytics/manager/learner-progress/"
    
    print("\n1. Testing Telemetry without Token...")
    try:
        resp = requests.get(telemetry_url)
        print(f"Status without token: {resp.status_code}")
        if resp.status_code == 401:
             print("Correctly rejected (401)")
        else:
             print(f"Unexpected status: {resp.status_code}")
    except Exception as e:
        print(f"Connection failed: {e}")

    # 2. Test JSON Upload with invalid token (to check 401 vs 415)
    print("\n2. Testing JSON Upload with Invalid Token...")
    upload_url = "http://localhost:8000/api/modules/stream/upload/"
    headers = {
        "Authorization": "Bearer invalid_token_123",
        "Content-Type": "application/json"
    }
    data = {"title": "Test", "url": "http://test.com", "week": 1}
    
    try:
        resp = requests.post(upload_url, json=data, headers=headers)
        print(f"Status with invalid token: {resp.status_code}")
        
        if resp.status_code == 401:
            print("Got 401 -> JSON Content-Type accepted, Auth failed (Expected)")
        elif resp.status_code == 415:
            print("Got 415 -> JSON Content-Type REJECTED (Fix didn't work?)")
        else:
            print(f"Status: {resp.status_code}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_auth_endpoints()
