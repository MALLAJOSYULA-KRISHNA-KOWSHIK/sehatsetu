from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date
from app.models.user import Role, Gender

class UserProfileBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: Gender
    village_town: str
    district: str
    state: str
    preferred_language: str = "en"

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    phone_number: str
    password: str
    email: Optional[EmailStr] = None
    role: Role = Role.PATIENT
    profile: UserProfileCreate

class UserLogin(BaseModel):
    phone_number: str
    password: str

class QRLoginRequest(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: str
    phone_number: str
    email: Optional[str]
    role: Role
    managed_facility_id: Optional[str] = None
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone_number: Optional[str] = None
    role: Optional[Role] = None
