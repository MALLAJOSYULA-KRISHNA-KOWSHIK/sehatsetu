from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime

class MedicineReminderBase(BaseModel):
    medicine_name: str
    dosage_text: str
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    reminder_time: time
    instructions: Optional[str] = None

class MedicineReminderCreate(MedicineReminderBase):
    pass

class MedicineReminderResponse(MedicineReminderBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AppointmentReminderBase(BaseModel):
    appointment_id: str
    remind_at: datetime

class AppointmentReminderCreate(AppointmentReminderBase):
    pass

class AppointmentReminderResponse(AppointmentReminderBase):
    id: str
    user_id: str
    is_sent: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
