import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.services.leapleaf_client import get_nearby_hospitals

async def main():
    # Test coordinates for a busy place, e.g. New Delhi, India
    lat, lon = 28.6139, 77.2090
    print(f"Testing Healthsites API for {lat}, {lon}")
    results = await get_nearby_hospitals(lat, lon, radius=5.0)
    print(f"Found {len(results)} hospitals")
    for r in results[:5]:
        print(r)

if __name__ == "__main__":
    asyncio.run(main())
