from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.facility import HealthcareFacility
from app.schemas.appointment import AppointmentResponse, AppointmentCreate, AppointmentDecline
from app.models.user import User, Role
from app.dependencies.auth import get_current_active_user, require_role

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate, 
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    # Check for conflicts for the same user on the same date and time
    conflict_stmt = select(Appointment).where(
        Appointment.user_id == current_user.id,
        Appointment.preferred_date == appointment.preferred_date,
        Appointment.preferred_time == appointment.preferred_time,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED, AppointmentStatus.COMPLETED])
    )
    conflict_result = await db.execute(conflict_stmt)
    if conflict_result.scalars().first():
        raise HTTPException(status_code=400, detail="You already have an appointment scheduled for this exact date and time.")

    # Also check if the doctor is already booked at that date and time
    doc_conflict_stmt = select(Appointment).where(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.preferred_date == appointment.preferred_date,
        Appointment.preferred_time == appointment.preferred_time,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED, AppointmentStatus.COMPLETED])
    )
    doc_conflict_result = await db.execute(doc_conflict_stmt)
    if doc_conflict_result.scalars().first():
        raise HTTPException(status_code=400, detail="This doctor is already booked for this exact date and time.")

    db_appointment = Appointment(
        user_id=current_user.id,
        **appointment.model_dump()
    )
    db.add(db_appointment)
    await db.commit()
    
    # Fetch the fully loaded appointment to satisfy the response model
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == db_appointment.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    # Patients see their own. Admins/Workers see all or facility-specific.
    if current_user.role == Role.PATIENT:
        stmt = select(Appointment).options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
        ).where(Appointment.user_id == current_user.id)
    else:
        stmt = select(Appointment).options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
        )
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=AppointmentResponse)
async def get_appointment(
    id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == Role.PATIENT and appointment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
        
    return appointment

@router.put("/{id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == id, Appointment.user_id == current_user.id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appointment.status = AppointmentStatus.CANCELLED
    await db.commit()
    
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == appointment.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.put("/{id}/accept", response_model=AppointmentResponse)
async def accept_appointment(
    id: str, 
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="User is not associated with any facility")
        
    stmt = select(Appointment).where(Appointment.id == id, Appointment.facility_id == current_user.managed_facility_id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or not associated with your facility")
        
    appointment.status = AppointmentStatus.CONFIRMED
    await db.commit()
    
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == appointment.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.put("/{id}/complete", response_model=AppointmentResponse)
async def complete_appointment(
    id: str, 
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="User is not associated with any facility")
        
    stmt = select(Appointment).where(Appointment.id == id, Appointment.facility_id == current_user.managed_facility_id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or not associated with your facility")
        
    appointment.status = AppointmentStatus.COMPLETED
    await db.commit()
    
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == appointment.id)
    result = await db.execute(stmt)
    return result.scalars().first()
@router.put("/{id}/decline", response_model=AppointmentResponse)
async def decline_appointment(
    id: str, 
    decline_data: AppointmentDecline,
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="User is not associated with any facility")
        
    stmt = select(Appointment).where(Appointment.id == id, Appointment.facility_id == current_user.managed_facility_id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or not associated with your facility")
        
    appointment.status = AppointmentStatus.REJECTED
    appointment.decline_reason = decline_data.decline_reason
    await db.commit()
    
    stmt = select(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.facility).selectinload(HealthcareFacility.services)
    ).where(Appointment.id == appointment.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    id: str, 
    current_user: User = Depends(require_role([Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Appointment).where(Appointment.id == id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    await db.delete(appointment)
    await db.commit()
    return None
