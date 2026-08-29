from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorResponse, DoctorDetailResponse, DoctorCreate
from app.models.user import Role
from app.dependencies.auth import require_role

from app.models.facility import HealthcareFacility

router = APIRouter(tags=["doctors"])

@router.get("/doctors", response_model=List[DoctorDetailResponse])
async def get_doctors(
    skip: int = 0, 
    limit: int = 100,
    specialization: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Doctor).options(selectinload(Doctor.facility).selectinload(HealthcareFacility.services))
    if specialization:
        stmt = stmt.where(Doctor.specialization == specialization)
    stmt = stmt.offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/facilities/{facility_id}/specializations", response_model=List[str])
async def get_facility_specializations(facility_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Doctor.specialization).where(Doctor.facility_id == facility_id).distinct()
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/facilities/{facility_id}/doctors", response_model=List[DoctorResponse])
async def get_facility_doctors(facility_id: str, specialization: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Doctor).where(Doctor.facility_id == facility_id)
    if specialization:
        stmt = stmt.where(Doctor.specialization == specialization)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/doctors/{id}", response_model=DoctorDetailResponse)
async def get_doctor(id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Doctor).options(selectinload(Doctor.facility)).where(Doctor.id == id)
    result = await db.execute(stmt)
    doctor = result.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.post("/doctors", response_model=DoctorResponse, dependencies=[Depends(require_role([Role.ADMIN]))])
async def create_doctor(doctor: DoctorCreate, db: AsyncSession = Depends(get_db)):
    db_doctor = Doctor(**doctor.model_dump())
    db.add(db_doctor)
    await db.commit()
    await db.refresh(db_doctor)
    return db_doctor
