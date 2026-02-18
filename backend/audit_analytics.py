import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def audit_analytics():
    print("\n--- MANAGER DASHBOARD AUDIT ---")
    
    # 1. Login
    try:
        auth_resp = requests.post(f"{BASE_URL}/auth/login/", json={
            "username": "manager@lms.com",
            "password": "securepassword123"
        })
        token = auth_resp.json().get('access')
        if not token:
            print("[FAIL] Manager Login Failed")
            return
    except Exception as e:
        print(f"[FAIL] Auth Connection Error: {e}")
        return

    # 2. Test Analytics Endpoint
    print("Testing Analytics Endpoint...")
    start_time = time.time()
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/analytics/manager/week-progress/", headers=headers)
        
        duration = time.time() - start_time
        
        if resp.status_code == 200:
            print(f"[OK] Analytics Response: 200 OK ({duration:.3f}s)")
            data = resp.json()
            
            # Check if list (likely list of weekly data)
            if isinstance(data, list):
                print(f"[OK] Response is List (Length: {len(data)})")
                if len(data) > 0:
                     print(f"     First Item Keys: {list(data[0].keys())}")
            elif isinstance(data, dict):
                 if 'week_data' in data and 'leaderboard' in data:
                    print(f"[OK] Schema Valid (Keys: {list(data.keys())})")
                    print(f"     Modules Tracked: {len(data['week_data'])}")
                    print(f"     Learners Ranked: {len(data['leaderboard'])}")
                 else:
                    print(f"[FAIL] Invalid Schema: {list(data.keys())}")
            else:
                 print(f"[FAIL] Unexpected Type: {type(data)}")

        else:
            print(f"[FAIL] Analytics Error: {resp.status_code} {resp.text}")

    except Exception as e:
        print(f"[FAIL] Connection Error: {e}")

if __name__ == "__main__":
    audit_analytics()
