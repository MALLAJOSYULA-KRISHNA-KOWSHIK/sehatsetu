from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.database import Base

class EscalationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"

class ProfessionalEscalation(Base):
    __tablename__ = "professional_escalations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    priority = Column(String, default="NORMAL") # HIGH, URGENT, NORMAL
    status = Column(SQLEnum(EscalationStatus), default=EscalationStatus.PENDING)
    
    assigned_professional_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    assigned_professional = relationship("User", foreign_keys=[assigned_professional_id])
