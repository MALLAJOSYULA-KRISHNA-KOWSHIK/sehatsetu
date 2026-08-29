import httpx
try:
    res = httpx.get("https://healthsites.io/api/v2/facilities/", params={"page": 1}, follow_redirects=True)
    print("Status:", res.status_code)
    data = res.json()
    if isinstance(data, list) and len(data) > 0:
        print("First item:", data[0])
    elif isinstance(data, dict):
        print("Keys:", data.keys())
        if "features" in data and len(data["features"]) > 0:
             print("First feature:", data["features"][0])
        elif "results" in data and len(data["results"]) > 0:
             print("First result:", data["results"][0])
    else:
        print("Data:", str(data)[:500])
except Exception as e:
    print("Error:", e)
