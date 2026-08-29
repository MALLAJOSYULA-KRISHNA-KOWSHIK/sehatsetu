from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.user import UserResponse, UserProfileCreate
from app.dependencies.auth import get_current_active_user
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.put("/me", response_model=UserResponse)
async def update_user_me(profile_update: UserProfileCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user.profile:
        # Create profile if missing
        new_profile = UserProfile(user_id=user.id, **profile_update.model_dump())
        db.add(new_profile)
    else:
        # Update existing profile
        for key, value in profile_update.model_dump().items():
            setattr(user.profile, key, value)
            
    await db.commit()
    
    # Re-query to ensure relationships are eagerly loaded and prevent MissingGreenlet errors
    stmt = select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().first()
