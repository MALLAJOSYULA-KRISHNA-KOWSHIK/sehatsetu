from sqlalchemy import Column, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    facility_id = Column(String, ForeignKey("healthcare_facilities.id"), nullable=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=True)
    
    record_type = Column(String, nullable=False) # e.g., "Prescription", "Lab Report", "Vaccination"
    title = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(String)
    file_path = Column(String, nullable=False) # local path or cloud storage URL
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    facility = relationship("HealthcareFacility")
    doctor = relationship("Doctor")
