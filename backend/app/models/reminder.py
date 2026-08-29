from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Time, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base

class MedicineReminder(Base):
    __tablename__ = "medicine_reminders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    medicine_name = Column(String, nullable=False)
    dosage_text = Column(String, nullable=False)
    frequency = Column(String, nullable=False) # e.g. "Daily", "Weekly"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    reminder_time = Column(Time, nullable=False)
    instructions = Column(String) # e.g. "After food"
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class AppointmentReminder(Base):
    __tablename__ = "appointment_reminders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=False)
    
    remind_at = Column(DateTime, nullable=False)
    is_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    appointment = relationship("Appointment")
