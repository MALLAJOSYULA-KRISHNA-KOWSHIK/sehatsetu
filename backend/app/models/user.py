from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Integer, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from app.database import Base

class Role(str, enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    HEALTH_WORKER = "HEALTH_WORKER"
    ADMIN = "ADMIN"

class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(Role), default=Role.PATIENT, nullable=False)
    managed_facility_id = Column(String, ForeignKey("healthcare_facilities.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    managed_facility = relationship("HealthcareFacility")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(SQLEnum(Gender), nullable=False)
    village_town = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    preferred_language = Column(String, default="en")

    user = relationship("User", back_populates="profile")
