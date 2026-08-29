from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.models.appointment import AppointmentStatus
from app.schemas.doctor import DoctorResponse
from app.schemas.facility import HealthcareFacilityResponse

class AppointmentBase(BaseModel):
    facility_id: str
    doctor_id: str
    preferred_date: date
    preferred_time: time
    reason: Optional[str] = None
    is_escalated: Optional[bool] = False
    urgency_level: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: AppointmentStatus
    
class AppointmentDecline(BaseModel):
    decline_reason: str

class AppointmentResponse(AppointmentBase):
    id: str
    user_id: str
    status: AppointmentStatus
    decline_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    doctor: Optional[DoctorResponse] = None
    facility: Optional[HealthcareFacilityResponse] = None
    
    class Config:
        from_attributes = True
