from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

facility_services_association = Table(
    'facility_services', Base.metadata,
    Column('facility_id', String, ForeignKey('healthcare_facilities.id'), primary_key=True),
    Column('service_id', String, ForeignKey('services.id'), primary_key=True)
)

class HealthcareFacility(Base):
    __tablename__ = "healthcare_facilities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True, nullable=False)
    type = Column(String, index=True, nullable=False) # e.g. Hospital, Clinic, Primary Health Centre
    address = Column(String, nullable=False)
    city = Column(String)
    district = Column(String, index=True)
    state = Column(String)
    pin_code = Column(String)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    
    is_24_7 = Column(Boolean, default=False)
    has_emergency = Column(Boolean, default=False)
    opening_hours = Column(String) # e.g. "09:00 AM - 05:00 PM"

    services = relationship("Service", secondary=facility_services_association, back_populates="facilities")
    doctors = relationship("Doctor", back_populates="facility")

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)

    facilities = relationship("HealthcareFacility", secondary=facility_services_association, back_populates="services")
