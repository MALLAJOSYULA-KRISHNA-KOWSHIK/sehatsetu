from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models.emergency import EmergencyContact
from app.schemas.emergency import EmergencyContactResponse, EmergencyContactCreate
from app.models.user import User
from app.dependencies.auth import get_current_active_user

router = APIRouter(prefix="/emergency-contacts", tags=["emergency-contacts"])

@router.post("/", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    contact: EmergencyContactCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_contact = EmergencyContact(user_id=current_user.id, **contact.model_dump())
    db.add(db_contact)
    await db.commit()
    await db.refresh(db_contact)
    return db_contact

@router.get("/", response_model=List[EmergencyContactResponse])
async def get_emergency_contacts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EmergencyContact).where(EmergencyContact.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    id: str,
    contact_update: EmergencyContactCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EmergencyContact).where(EmergencyContact.id == id, EmergencyContact.user_id == current_user.id)
    result = await db.execute(stmt)
    db_contact = result.scalars().first()
    
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    for key, value in contact_update.model_dump().items():
        setattr(db_contact, key, value)
        
    await db.commit()
    await db.refresh(db_contact)
    return db_contact

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emergency_contact(
    id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EmergencyContact).where(EmergencyContact.id == id, EmergencyContact.user_id == current_user.id)
    result = await db.execute(stmt)
    db_contact = result.scalars().first()
    
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    await db.delete(db_contact)
    await db.commit()
    return None
