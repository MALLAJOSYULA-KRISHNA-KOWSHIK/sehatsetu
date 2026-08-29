from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models.reminder import MedicineReminder, AppointmentReminder
from app.schemas.reminder import MedicineReminderResponse, MedicineReminderCreate, AppointmentReminderResponse, AppointmentReminderCreate
from app.models.user import User, Role
from app.dependencies.auth import get_current_active_user

router = APIRouter(tags=["reminders"])

@router.post("/medicine-reminders", response_model=MedicineReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine_reminder(
    reminder: MedicineReminderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_reminder = MedicineReminder(user_id=current_user.id, **reminder.model_dump())
    db.add(db_reminder)
    await db.commit()
    await db.refresh(db_reminder)
    return db_reminder

@router.get("/medicine-reminders", response_model=List[MedicineReminderResponse])
async def get_medicine_reminders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MedicineReminder).where(MedicineReminder.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/medicine-reminders/{id}", response_model=MedicineReminderResponse)
async def update_medicine_reminder(
    id: str,
    reminder_update: MedicineReminderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MedicineReminder).where(MedicineReminder.id == id, MedicineReminder.user_id == current_user.id)
    result = await db.execute(stmt)
    db_reminder = result.scalars().first()
    
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    for key, value in reminder_update.model_dump().items():
        setattr(db_reminder, key, value)
        
    await db.commit()
    await db.refresh(db_reminder)
    return db_reminder

@router.delete("/medicine-reminders/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_reminder(
    id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MedicineReminder).where(MedicineReminder.id == id, MedicineReminder.user_id == current_user.id)
    result = await db.execute(stmt)
    db_reminder = result.scalars().first()
    
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    await db.delete(db_reminder)
    await db.commit()
    return None

@router.post("/appointment-reminders", response_model=AppointmentReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment_reminder(
    reminder: AppointmentReminderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_reminder = AppointmentReminder(user_id=current_user.id, **reminder.model_dump())
    db.add(db_reminder)
    await db.commit()
    await db.refresh(db_reminder)
    return db_reminder

@router.get("/appointment-reminders", response_model=List[AppointmentReminderResponse])
async def get_appointment_reminders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AppointmentReminder).where(AppointmentReminder.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()
