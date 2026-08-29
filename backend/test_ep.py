import httpx, json

r = httpx.get('http://localhost:8000/facilities/nearby', params={'latitude': 18.1124, 'longitude': 83.4064, 'radius': 25.0}, timeout=120)
print(f"Status: {r.status_code}")
d = r.json()
print(f"Count: {len(d)}")
sources = set(x['source'] for x in d)
print(f"Sources: {sources}")
for x in d[:5]:
    print(f"  - {x['name']} | {x['source']} | {x['distance']} km")
