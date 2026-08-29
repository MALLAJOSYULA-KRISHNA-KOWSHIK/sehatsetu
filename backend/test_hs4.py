import httpx
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("HEALTHSITES_API_KEY")

try:
    res = httpx.get("https://healthsites.io/api/v3/facilities/", headers={"api-key": api_key}, follow_redirects=True)
    print("Status:", res.status_code)
    print("Response:", res.text[:500])
except Exception as e:
    print("Error:", e)
