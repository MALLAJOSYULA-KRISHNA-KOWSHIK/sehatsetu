import os
import httpx
import asyncio
import logging
import math
from typing import List, Dict, Any
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

# Basic in-memory cache to prevent rate-limiting (stores queries for 5 minutes)
_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = timedelta(minutes=5)

# Multiple Overpass API mirrors for resilience (ordered by reliability)
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

def get_cache_key(lat: float, lon: float, radius: float) -> str:
    # Round coordinates to ~1km resolution for caching (2 decimal places is ~1.1km)
    return f"{round(lat, 2)}_{round(lon, 2)}_{radius}"

async def get_nearby_hospitals(lat: float, lon: float, radius: float = 10.0) -> List[Dict[str, Any]]:
    """
    Fetches nearby hospitals using the Overpass API (OpenStreetMap).
    Uses multiple mirror endpoints for resilience.
    Falls back gracefully if all mirrors are down.
    """
    cache_key = get_cache_key(lat, lon, radius)
    
    # Check cache first
    if cache_key in _cache:
        cache_entry = _cache[cache_key]
        if datetime.utcnow() - cache_entry["timestamp"] < CACHE_TTL:
            logger.info("Serving nearby hospitals from cache")
            return cache_entry["data"]

    api_key = os.getenv("LEAPLEAF_API_KEY")
    base_url = os.getenv("LEAPLEAF_BASE_URL")

    results = []
    
    try:
        if api_key and base_url:
            # Real LeapLeaf API call (if configured)
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{base_url}/v1/hospitals",
                    params={"lat": lat, "lng": lon, "radius": radius},
                    headers={"Authorization": f"Bearer {api_key}"}
                )
                response.raise_for_status()
                data = response.json()
                
                for item in data.get("results", []):
                    results.append({
                        "id": str(uuid.uuid4()),
                        "name": item.get("name") or "Unknown Facility",
                        "type": item.get("type") or "hospital",
                        "latitude": item.get("lat"),
                        "longitude": item.get("lng"),
                        "address": item.get("address"),
                        "phone": item.get("phone"),
                        "distance": round(item.get("distance_km", 0), 2),
                        "source": "leapleaf"
                    })
        else:
            # Use Overpass API (OpenStreetMap) — no API key needed
            logger.info("Using Overpass API (OSM) for nearby hospitals.")
            
            # Bounding box calculation
            lat_delta = radius / 111.0
            lon_delta = radius / (111.0 * math.cos(math.radians(lat)))
            
            south = lat - lat_delta
            north = lat + lat_delta
            west = lon - lon_delta
            east = lon + lon_delta
            
            # Query hospitals AND clinics, also search "way" (building outlines) not just nodes
            query = f"""
            [out:json][timeout:25];
            (
              node["amenity"="hospital"]({south},{west},{north},{east});
              way["amenity"="hospital"]({south},{west},{north},{east});
              node["amenity"="clinic"]({south},{west},{north},{east});
              way["amenity"="clinic"]({south},{west},{north},{east});
            );
            out center body;
            >;
            out skel qt;
            """
            
            headers = {
                "User-Agent": "SehatSetuApp/1.0 (Contact: admin@sehatsetu.local)"
            }
            
            # Try multiple Overpass mirrors
            last_error = None
            for endpoint in OVERPASS_ENDPOINTS:
                try:
                    logger.info(f"Trying Overpass mirror: {endpoint}")
                    async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
                        # Use POST to avoid URL length issues
                        response = await client.post(
                            endpoint,
                            data={"data": query}
                        )
                        logger.info(f"Overpass response status: {response.status_code}")
                        response.raise_for_status()
                        data = response.json()
                        
                        for element in data.get("elements", []):
                            tags = element.get("tags", {})
                            name = tags.get("name")
                            if not name:
                                continue  # Skip unnamed facilities
                            
                            # For "way" elements, use the center coordinates
                            elem_lat = element.get("lat") or (element.get("center", {}).get("lat"))
                            elem_lon = element.get("lon") or (element.get("center", {}).get("lon"))
                            
                            if not elem_lat or not elem_lon:
                                continue
                            
                            # Build address from available tags
                            addr_parts = []
                            if tags.get("addr:street"):
                                addr_parts.append(tags["addr:street"])
                            if tags.get("addr:city"):
                                addr_parts.append(tags["addr:city"])
                            if tags.get("addr:district"):
                                addr_parts.append(tags["addr:district"])
                            address = ", ".join(addr_parts) if addr_parts else None
                            
                            results.append({
                                "id": f"ext_{element['id']}",
                                "name": name,
                                "type": tags.get("amenity", "hospital"),
                                "latitude": elem_lat,
                                "longitude": elem_lon,
                                "address": address,
                                "phone": tags.get("phone") or tags.get("contact:phone"),
                                "distance": None,  # Will be calculated by the router
                                "source": "leapleaf"
                            })
                    
                    logger.info(f"Overpass mirror {endpoint} returned {len(results)} results.")
                    break  # Success — don't try remaining mirrors
                    
                except Exception as e:
                    last_error = e
                    logger.warning(f"Overpass mirror {endpoint} failed: {str(e)}")
                    continue  # Try the next mirror
            
            if not results and last_error:
                logger.error(f"All Overpass mirrors failed. Last error: {last_error}")

    except Exception as e:
        logger.error(f"External API call failed: {str(e)}")
                
    # Update cache
    if results:
        _cache[cache_key] = {
            "timestamp": datetime.utcnow(),
            "data": results
        }
        
    return results
