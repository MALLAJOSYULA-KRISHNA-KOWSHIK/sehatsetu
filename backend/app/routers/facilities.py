from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
import math
from app.database import get_db
from app.models.facility import HealthcareFacility, Service
from app.schemas.facility import HealthcareFacilityResponse, HealthcareFacilityCreate
from app.models.user import Role
from app.dependencies.auth import get_current_active_user, require_role
from app.services.leapleaf_client import get_nearby_hospitals
import asyncio

router = APIRouter(prefix="/facilities", tags=["facilities"])

# Haversine formula for distance calculation in Python
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

@router.get("/nearby", response_model=List[HealthcareFacilityResponse])
async def get_nearby_facilities(
    latitude: float,
    longitude: float,
    radius: float = 10.0,
    facility_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(HealthcareFacility).options(selectinload(HealthcareFacility.services))
    if facility_type:
        stmt = stmt.where(HealthcareFacility.type == facility_type)
        
    # Execute DB query first
    db_result = await db.execute(stmt)
    
    # Then fetch external hospitals (Overpass API)
    try:
        api_results = await get_nearby_hospitals(latitude, longitude, radius)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"External API error (ignored): {e}")
        api_results = []
    
    local_facilities = db_result.scalars().all()
    
    nearby = []
    
    # Process local facilities
    for facility in local_facilities:
        dist = haversine(latitude, longitude, facility.latitude, facility.longitude)
        if dist <= radius:
            facility.distance = round(dist, 2)
            facility.source = "sehatsetu"
            nearby.append(facility)
            
    # Process external facilities
    for ext_fac in api_results:
        # Distance might already be calculated by the API, but let's recalculate if missing
        dist = ext_fac.get("distance")
        if dist is None:
            dist = haversine(latitude, longitude, ext_fac["latitude"], ext_fac["longitude"])
            
        if dist <= radius:
            # We construct a mock object that fits the response schema perfectly
            mock_facility = HealthcareFacility(
                id=ext_fac["id"],
                name=ext_fac["name"],
                type=ext_fac["type"],
                latitude=ext_fac["latitude"],
                longitude=ext_fac["longitude"],
                address=ext_fac.get("address") or "Unknown Address",
                phone=ext_fac.get("phone"),
                is_24_7=False,
                has_emergency=False,
                city=None,
                district=None,
                state=None,
                pin_code=None,
                email=None,
                website=None,
                opening_hours=None
            )
            # Monkey-patch attributes needed for Pydantic
            setattr(mock_facility, "distance", round(dist, 2))
            setattr(mock_facility, "source", "leapleaf")
            setattr(mock_facility, "services", []) # External API doesn't provide these detailed services
            nearby.append(mock_facility)
            
    # Sort all by distance
    nearby.sort(key=lambda x: x.distance)
    return nearby

@router.get("/", response_model=List[HealthcareFacilityResponse])
async def get_facilities(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(HealthcareFacility).options(selectinload(HealthcareFacility.services)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=HealthcareFacilityResponse)
async def get_facility(id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(HealthcareFacility).options(selectinload(HealthcareFacility.services)).where(HealthcareFacility.id == id)
    result = await db.execute(stmt)
    facility = result.scalars().first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility

@router.post("/", response_model=HealthcareFacilityResponse, dependencies=[Depends(require_role([Role.ADMIN]))])
async def create_facility(facility: HealthcareFacilityCreate, db: AsyncSession = Depends(get_db)):
    db_facility = HealthcareFacility(**facility.model_dump())
    db.add(db_facility)
    await db.commit()
    await db.refresh(db_facility)
    return db_facility
