from pydantic import BaseModel

class EmergencyContactBase(BaseModel):
    name: str
    relationship_type: str
    phone_number: str

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactResponse(EmergencyContactBase):
    id: str
    user_id: str
    
    class Config:
        from_attributes = True
