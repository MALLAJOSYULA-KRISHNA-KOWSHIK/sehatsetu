import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.services.leapleaf_client import get_nearby_hospitals

async def main():
    # Test with coordinates near Srikakulam, AP, India (from the user's screenshot)
    lat, lon = 18.1124, 83.4064
    print(f"Testing Overpass API for lat={lat}, lon={lon}, radius=25km")
    results = await get_nearby_hospitals(lat, lon, radius=25.0)
    print(f"Found {len(results)} external hospitals")
    for r in results[:10]:
        print(f"  - {r['name']} ({r['type']}) @ {r['latitude']},{r['longitude']}")

if __name__ == "__main__":
    asyncio.run(main())
