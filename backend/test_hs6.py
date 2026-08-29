import httpx
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("HEALTHSITES_API_KEY")

try:
    res = httpx.get(f"https://healthsites.io/api/v3/facilities/?api-key={api_key}", follow_redirects=True)
    print(res.text)
except Exception as e:
    print("Error:", e)
