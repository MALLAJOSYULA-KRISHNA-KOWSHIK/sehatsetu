from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models.escalation import ProfessionalEscalation, EscalationStatus
from app.schemas.escalation import EscalationResponse, EscalationCreate
from app.models.user import User, Role
from app.dependencies.auth import get_current_active_user, require_role

router = APIRouter(prefix="/escalations", tags=["escalations"])

@router.post("/", response_model=EscalationResponse, status_code=status.HTTP_201_CREATED)
async def create_escalation(
    escalation: EscalationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_escalation = ProfessionalEscalation(user_id=current_user.id, **escalation.model_dump())
    db.add(db_escalation)
    await db.commit()
    await db.refresh(db_escalation)
    return db_escalation

@router.get("/", response_model=List[EscalationResponse])
async def get_escalations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == Role.PATIENT:
        stmt = select(ProfessionalEscalation).where(ProfessionalEscalation.user_id == current_user.id)
    else:
        # Health workers and Admins see all
        stmt = select(ProfessionalEscalation)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=EscalationResponse)
async def get_escalation(
    id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ProfessionalEscalation).where(ProfessionalEscalation.id == id)
    result = await db.execute(stmt)
    db_escalation = result.scalars().first()
    
    if not db_escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
        
    if current_user.role == Role.PATIENT and db_escalation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return db_escalation
