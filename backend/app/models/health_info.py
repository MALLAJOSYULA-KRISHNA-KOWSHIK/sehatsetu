from sqlalchemy import Column, String, DateTime
import uuid
from datetime import datetime
from app.database import Base

class HealthInformation(Base):
    __tablename__ = "health_information"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    symptoms = Column(String)
    general_precautions = Column(String)
    when_to_seek_care = Column(String)
    emergency_warning_signs = Column(String)
    source_reference = Column(String)
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
