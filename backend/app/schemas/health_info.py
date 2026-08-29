from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HealthInformationBase(BaseModel):
    category: str
    title: str
    description: str
    symptoms: Optional[str] = None
    general_precautions: Optional[str] = None
    when_to_seek_care: Optional[str] = None
    emergency_warning_signs: Optional[str] = None
    source_reference: Optional[str] = None

class HealthInformationCreate(HealthInformationBase):
    pass

class HealthInformationResponse(HealthInformationBase):
    id: str
    last_updated: datetime
    
    class Config:
        from_attributes = True
