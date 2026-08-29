from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class HealthRecordBase(BaseModel):
    facility_id: Optional[str] = None
    doctor_id: Optional[str] = None
    record_type: str
    title: str
    date: date
    notes: Optional[str] = None

class HealthRecordResponse(HealthRecordBase):
    id: str
    user_id: str
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True
