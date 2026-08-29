from sqlalchemy import Column, String, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    facility_id = Column(String, ForeignKey("healthcare_facilities.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    specialization = Column(String, index=True, nullable=False)
    qualification = Column(String)
    experience_years = Column(Integer)
    languages = Column(String) # e.g. "English, Hindi"
    phone = Column(String)
    consultation_fee = Column(Float)
    availability_status = Column(String, default="Unknown") # "Available", "Busy", "Offline", "Unknown"

    facility = relationship("HealthcareFacility", back_populates="doctors")
