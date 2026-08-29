from pydantic import BaseModel
from typing import Optional
from app.schemas.facility import HealthcareFacilityResponse

class DoctorBase(BaseModel):
    facility_id: str
    name: str
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: Optional[float] = None
    availability_status: str = "Unknown"

class DoctorCreate(DoctorBase):
    pass

class DoctorResponse(DoctorBase):
    id: str
    
    class Config:
        from_attributes = True

class DoctorDetailResponse(DoctorResponse):
    facility: HealthcareFacilityResponse
    class Config:
        from_attributes = True
