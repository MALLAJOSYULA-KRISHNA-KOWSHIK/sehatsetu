from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin, QRLoginRequest
from app.utils.security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from app.dependencies.auth import get_current_active_user
from sqlalchemy.orm import selectinload
from jose import JWTError, jwt
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    stmt = select(User).where(User.phone_number == user_data.phone_number)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    if user_data.email:
        stmt = select(User).where(User.email == user_data.email)
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        phone_number=user_data.phone_number,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    db.add(db_user)
    await db.flush() # To get db_user.id
    
    # Create profile
    db_profile = UserProfile(
        user_id=db_user.id,
        **user_data.profile.model_dump()
    )
    db.add(db_profile)
    await db.commit()
    
    # Reload with profile
    stmt = select(User).options(selectinload(User.profile)).where(User.id == db_user.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.phone_number == user_data.phone_number)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.phone_number, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out. Client should remove token."}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.get("/qr-token")
async def get_qr_token(current_user: User = Depends(get_current_active_user)):
    # Create a long-lived JWT token specifically for QR login (e.g., 10 years)
    access_token_expires = timedelta(days=3650)
    qr_token = create_access_token(
        data={"sub": current_user.phone_number, "type": "qr_login", "role": current_user.role}, expires_delta=access_token_expires
    )
    return {"qr_token": qr_token}

@router.post("/qr-login", response_model=Token)
async def qr_login(req: QRLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        phone_number: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if phone_number is None or token_type != "qr_login":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid QR token")
            
        stmt = select(User).where(User.phone_number == phone_number)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            
        access_token = create_access_token(data={"sub": user.phone_number, "role": user.role})
        return {"access_token": access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate QR credentials",
        )
