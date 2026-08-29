import httpx
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("HEALTHSITES_API_KEY")

headers_to_try = [
    {"api-key": api_key},
    {"Authorization": f"Api-Key {api_key}"},
    {"Authorization": f"Token {api_key}"},
    {"X-API-Key": api_key}
]

for h in headers_to_try:
    try:
        res = httpx.get("https://healthsites.io/api/v3/facilities/", headers=h, follow_redirects=True)
        print(f"Header {list(h.keys())[0]}: {res.status_code} - {res.text[:100]}")
    except Exception as e:
        print("Error:", e)
