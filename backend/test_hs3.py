import httpx
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("HEALTHSITES_API_KEY")

try:
    print("Testing with Authorization: Token")
    res = httpx.get("https://healthsites.io/api/v3/facilities/", headers={"Authorization": f"Token {api_key}"}, follow_redirects=True)
    print("Status:", res.status_code)
    
    if res.status_code == 403:
        print("Testing with api-key query param")
        res = httpx.get(f"https://healthsites.io/api/v3/facilities/?api-key={api_key}", follow_redirects=True)
        print("Status:", res.status_code)
        
    if res.status_code == 200:
        print("Success! Data keys:", res.json().keys() if isinstance(res.json(), dict) else "List")
except Exception as e:
    print("Error:", e)
