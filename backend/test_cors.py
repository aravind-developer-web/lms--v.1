import requests
import os

def test_upload():
    print("Testing CORS and Upload Endpoint...")
    
    url = "http://localhost:8000/api/modules/stream/upload/"
    origin = "http://localhost:3000"
    
    # 1. Test OPTIONS (CORS Preflight)
    print("\n1. Sending OPTIONS request...")
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type"
    }
    try:
        resp = requests.options(url, headers=headers)
        print(f"Status: {resp.status_code}")
        print("CORS Headers:")
        for k, v in resp.headers.items():
            if 'access-control' in k.lower():
                print(f"  {k}: {v}")
                
        if resp.status_code == 200 and 'Access-Control-Allow-Origin' in resp.headers:
            print("CORS OPTIONS Passed")
        else:
            print("CORS OPTIONS Failed")
    except Exception as e:
        print(f"Connection Failed: {e}")
        return

    # 2. Test POST (Small File Upload)
    print("\n2. Sending POST request (Small File)...")
    files = {'video': ('test_video.txt', b'fake video content')}
    data = {'title': 'CORS Test', 'week': 1, 'url': ''}
    
    headers = {"Origin": origin}
    try:
        resp = requests.post(url, headers=headers, data=data, files=files)
        print(f"Status: {resp.status_code}")
        print("CORS Headers:")
        for k, v in resp.headers.items():
             if 'access-control' in k.lower():
                print(f"  {k}: {v}")
                
        if 'Access-Control-Allow-Origin' in resp.headers:
             print("CORS on POST Passed (Headers present)")
        else:
             print("CORS on POST Failed (Headers missing)")
             
    except Exception as e:
        print(f"POST Failed: {e}")

if __name__ == "__main__":
    test_upload()
