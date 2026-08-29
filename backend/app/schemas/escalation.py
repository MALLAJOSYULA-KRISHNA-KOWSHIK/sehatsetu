from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.escalation import EscalationStatus

class EscalationBase(BaseModel):
    reason: str
    priority: str = "NORMAL"

class EscalationCreate(EscalationBase):
    pass

class EscalationResponse(EscalationBase):
    id: str
    user_id: str
    status: EscalationStatus
    assigned_professional_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
