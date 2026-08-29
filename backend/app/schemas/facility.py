from pydantic import BaseModel
from typing import Optional, List

class ServiceBase(BaseModel):
    name: str

class ServiceResponse(ServiceBase):
    id: str
    class Config:
        from_attributes = True

class HealthcareFacilityBase(BaseModel):
    name: str
    type: str
    address: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_24_7: bool = False
    has_emergency: bool = False
    opening_hours: Optional[str] = None

class HealthcareFacilityCreate(HealthcareFacilityBase):
    pass

class HealthcareFacilityResponse(HealthcareFacilityBase):
    id: str
    services: List[ServiceResponse] = []
    
    # calculated distance from user query, if available
    distance: Optional[float] = None
    
    # Data source indicator
    source: str = "sehatsetu"
    
    class Config:
        from_attributes = True
