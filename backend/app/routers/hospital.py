from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import uuid
from datetime import date
from app.database import get_db
from app.models.user import User, Role, UserProfile
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordResponse
from app.schemas.doctor import DoctorResponse
from pydantic import BaseModel
from app.dependencies.auth import require_role

router = APIRouter(prefix="/hospital", tags=["hospital"])

UPLOAD_DIR = "uploads/records"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB

class HospitalDoctorCreateUpdate(BaseModel):
    name: str
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: Optional[float] = None

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="User is not associated with any facility")
        
    facility_id = current_user.managed_facility_id
    
    # Get pending appointments count
    pending_stmt = select(Appointment).where(
        Appointment.facility_id == facility_id, 
        Appointment.status == AppointmentStatus.PENDING
    )
    pending_res = await db.execute(pending_stmt)
    pending_count = len(pending_res.scalars().all())
    
    # Get today's appointments
    today = date.today()
    today_stmt = select(Appointment).where(
        Appointment.facility_id == facility_id, 
        Appointment.preferred_date == today,
        Appointment.status == AppointmentStatus.CONFIRMED
    )
    today_res = await db.execute(today_stmt)
    today_count = len(today_res.scalars().all())
    
    # Get total doctors
    doctors_stmt = select(Doctor).where(Doctor.facility_id == facility_id)
    doctors_res = await db.execute(doctors_stmt)
    doctors_count = len(doctors_res.scalars().all())
    
    # Get escalated appointments count
    escalated_stmt = select(Appointment).where(
        Appointment.facility_id == facility_id, 
        Appointment.is_escalated == True
    )
    escalated_res = await db.execute(escalated_stmt)
    escalated_count = len(escalated_res.scalars().all())
    
    return {
        "pending_appointments": pending_count,
        "today_appointments": today_count,
        "total_doctors": doctors_count,
        "escalated_appointments": escalated_count
    }

@router.get("/appointments")
async def get_hospital_appointments(
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="Not associated with any facility")
        
    stmt = select(Appointment).options(
        selectinload(Appointment.user).selectinload(User.profile),
        selectinload(Appointment.doctor)
    ).where(Appointment.facility_id == current_user.managed_facility_id).order_by(Appointment.created_at.desc())
    
    result = await db.execute(stmt)
    appointments = result.scalars().all()
    
    # Format for frontend
    return [{
        "id": appt.id,
        "patient_id": appt.user.id if appt.user else None,
        "patient_name": appt.user.profile.full_name if appt.user and appt.user.profile else "Unknown",
        "patient_phone": appt.user.phone_number if appt.user else "Unknown",
        "doctor_id": appt.doctor.id if appt.doctor else None,
        "doctor_name": appt.doctor.name if appt.doctor else "Unknown",
        "specialization": appt.doctor.specialization if appt.doctor else "Unknown",
        "preferred_date": appt.preferred_date,
        "preferred_time": appt.preferred_time,
        "status": appt.status,
        "decline_reason": appt.decline_reason,
        "is_escalated": appt.is_escalated,
        "urgency_level": appt.urgency_level,
        "created_at": appt.created_at
    } for appt in appointments]

@router.get("/patients")
async def get_hospital_patients(
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="Not associated with any facility")
        
    # Find all unique patients who have a confirmed or completed appointment at this facility
    stmt = select(Appointment).options(
        selectinload(Appointment.user).selectinload(User.profile)
    ).where(
        Appointment.facility_id == current_user.managed_facility_id,
        Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED])
    )
    result = await db.execute(stmt)
    appointments = result.scalars().all()
    
    patients = {}
    for appt in appointments:
        if appt.user_id not in patients and appt.user and appt.user.profile:
            patients[appt.user_id] = {
                "id": appt.user_id,
                "name": appt.user.profile.full_name,
                "phone": appt.user.phone_number,
                "gender": appt.user.profile.gender,
                "last_visit": appt.preferred_date,
                "last_doctor_id": appt.doctor_id
            }
        elif appt.user_id in patients and appt.preferred_date > patients[appt.user_id]["last_visit"]:
             patients[appt.user_id]["last_visit"] = appt.preferred_date
             patients[appt.user_id]["last_doctor_id"] = appt.doctor_id
            
    return list(patients.values())

@router.post("/health-records", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_patient_record(
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    title: str = Form(...),
    record_type: str = Form(...),
    record_date: date = Form(...),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="Not associated with any facility")
        
    # Verify patient has an appointment here
    stmt = select(Appointment).where(
        Appointment.facility_id == current_user.managed_facility_id,
        Appointment.user_id == patient_id
    )
    result = await db.execute(stmt)
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient has no record at this facility")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    # Read file to check size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
    # Save file
    file_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as f:
        f.write(file_content)
        
    db_record = HealthRecord(
        user_id=patient_id,
        facility_id=current_user.managed_facility_id,
        doctor_id=doctor_id,
        record_type=record_type,
        title=title,
        date=record_date,
        notes=notes,
        file_path=file_path
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return db_record

@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    doctor_data: HospitalDoctorCreateUpdate,
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="Not associated with any facility")
        
    db_doc = Doctor(
        id=str(uuid.uuid4()),
        facility_id=current_user.managed_facility_id,
        **doctor_data.model_dump()
    )
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)
    return db_doc

@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: str,
    doctor_data: HospitalDoctorCreateUpdate,
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="Not associated with any facility")
        
    stmt = select(Doctor).where(
        Doctor.id == doctor_id, 
        Doctor.facility_id == current_user.managed_facility_id
    )
    res = await db.execute(stmt)
    db_doc = res.scalars().first()
    
    if not db_doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    for key, value in doctor_data.model_dump().items():
        setattr(db_doc, key, value)
        
    await db.commit()
    await db.refresh(db_doc)
    return db_doc

@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(
    doctor_id: str,
    current_user: User = Depends(require_role([Role.HEALTH_WORKER, Role.ADMIN])), 
    db: AsyncSession = Depends(get_db)
):
    if not current_user.managed_facility_id:
        raise HTTPException(status_code=403, detail="Not associated with any facility")
        
    stmt = select(Doctor).where(
        Doctor.id == doctor_id, 
        Doctor.facility_id == current_user.managed_facility_id
    )
    res = await db.execute(stmt)
    db_doc = res.scalars().first()
    
    if not db_doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    await db.delete(db_doc)
    await db.commit()
    return None
