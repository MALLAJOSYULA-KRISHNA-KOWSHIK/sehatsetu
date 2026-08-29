from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Date, Time, Boolean
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from app.database import Base

class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    facility_id = Column(String, ForeignKey("healthcare_facilities.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    
    preferred_date = Column(Date, nullable=False)
    preferred_time = Column(Time, nullable=False)
    reason = Column(String, nullable=True)
    decline_reason = Column(String, nullable=True)
    
    is_escalated = Column(Boolean, default=False)
    urgency_level = Column(String, nullable=True)
    
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    facility = relationship("HealthcareFacility")
    doctor = relationship("Doctor")
