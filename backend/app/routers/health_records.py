from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import os
import uuid
import shutil
from datetime import date
from app.database import get_db
from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordResponse
from app.models.user import User, Role
from app.dependencies.auth import get_current_active_user, require_role

router = APIRouter(prefix="/health-records", tags=["health-records"])

UPLOAD_DIR = "uploads/records"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB

@router.post("/", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_health_record(
    title: str = Form(...),
    record_type: str = Form(...),
    record_date: date = Form(...),
    facility_id: Optional[str] = Form(None),
    doctor_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
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
        user_id=current_user.id,
        facility_id=facility_id,
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

@router.get("/", response_model=List[HealthRecordResponse])
async def get_health_records(
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == Role.PATIENT:
        stmt = select(HealthRecord).where(HealthRecord.user_id == current_user.id)
    else:
        # In real app, restrict by patient access permissions
        stmt = select(HealthRecord)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health_record(
    id: str, 
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(HealthRecord).where(HealthRecord.id == id)
    result = await db.execute(stmt)
    record = result.scalars().first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    if current_user.role == Role.PATIENT and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Delete file
    if os.path.exists(record.file_path):
        os.remove(record.file_path)
        
    await db.delete(record)
    await db.commit()
    return None
