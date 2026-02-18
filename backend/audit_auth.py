import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_auth():
    print("\n--- AUTHENTICATION AUDIT ---")
    
    # 1. Manager Login
    print("Testing Manager Login...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login/", json={
            "username": "manager@lms.com",
            "password": "securepassword123"
        })
        if resp.status_code == 200:
            manager_token = resp.json()['access']
            print("[OK] Manager Login Success")
        else:
            print(f"[FAIL] Manager Login Failed: {resp.status_code} {resp.text}")
            return
    except Exception as e:
        print(f"[FAIL] connection error: {e}")
        return

    # 2. Learner Login
    print("Testing Learner Login...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login/", json={
            "username": "learner1@lms.com",
            "password": "securepassword123"
        })
        if resp.status_code == 200:
            learner_token = resp.json()['access']
            print("[OK] Learner Login Success")
        else:
            print(f"[FAIL] Learner Login Failed: {resp.status_code}")
            return
    except Exception as e:
        print(f"[FAIL] connection error: {e}")
        return

    # 3. RBAC Test (Learner accessing Manager Route)
    print("Testing RBAC (Learner -> Manager Route)...")
    try:
        headers = {"Authorization": f"Bearer {learner_token}"}
        resp = requests.get(f"{BASE_URL}/manager/modules/", headers=headers)
        if resp.status_code == 403:
            print("[OK] RBAC Enforced (403 Forbidden)")
        else:
             print(f"[FAIL] RBAC Failed: Got {resp.status_code}, expected 403")
    except Exception as e:
        print(f"[FAIL] connection error: {e}")

    # 4. Manager Accessing Manager Route
    print("Testing Manager Access...")
    try:
        headers = {"Authorization": f"Bearer {manager_token}"}
        resp = requests.get(f"{BASE_URL}/manager/modules/", headers=headers)
        if resp.status_code == 200:
            print("[OK] Manager Access Granted")
        else:
             print(f"[FAIL] Manager Access Failed: {resp.status_code}")
    except Exception as e:
        print(f"[FAIL] connection error: {e}")

if __name__ == "__main__":
    test_auth()
