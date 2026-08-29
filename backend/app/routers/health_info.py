from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.database import get_db
from app.models.health_info import HealthInformation
from app.schemas.health_info import HealthInformationResponse, HealthInformationCreate
from app.models.user import Role
from app.dependencies.auth import require_role

router = APIRouter(prefix="/health-information", tags=["health-information"])

@router.get("/categories", response_model=List[str])
async def get_categories(db: AsyncSession = Depends(get_db)):
    stmt = select(HealthInformation.category).distinct()
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/", response_model=List[HealthInformationResponse])
async def get_health_information(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(HealthInformation)
    if category:
        stmt = stmt.where(HealthInformation.category == category)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=HealthInformationResponse)
async def get_health_information_by_id(id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(HealthInformation).where(HealthInformation.id == id)
    result = await db.execute(stmt)
    info = result.scalars().first()
    if not info:
        raise HTTPException(status_code=404, detail="Information not found")
    return info

@router.post("/", response_model=HealthInformationResponse, dependencies=[Depends(require_role([Role.ADMIN]))])
async def create_health_information(
    info: HealthInformationCreate, 
    db: AsyncSession = Depends(get_db)
):
    db_info = HealthInformation(**info.model_dump())
    db.add(db_info)
    await db.commit()
    await db.refresh(db_info)
    return db_info
