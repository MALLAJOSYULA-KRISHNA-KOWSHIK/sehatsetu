import asyncio
import httpx

async def main():
    print("Testing /facilities/nearby endpoint...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.get("http://localhost:8000/facilities/nearby", params={
                "latitude": 18.1124,
                "longitude": 83.4064,
                "radius": 25.0
            })
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                print(f"Found {len(data)} nearby facilities!")
                for f in data[:5]:
                    print(f"  - {f['name']} ({f['type']}) | {f['distance']} km | source: {f['source']}")
            else:
                print(f"Error: {res.text[:500]}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
