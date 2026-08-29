import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import engine, AsyncSessionLocal
from app.models.user import User, UserProfile, Role, Gender
from app.models.facility import HealthcareFacility
from app.models.doctor import Doctor
from app.utils.security import get_password_hash
from datetime import date
import uuid

async def seed_new_data():
    async with AsyncSessionLocal() as db:
        # Get the first hospital
        stmt = select(HealthcareFacility).where(HealthcareFacility.type == "Hospital")
        result = await db.execute(stmt)
        hospital = result.scalars().first()
        
        if not hospital:
            print("No hospital found, cannot proceed.")
            return

        # Check if admin already exists
        stmt = select(User).where(User.phone_number == "9999999999")
        result = await db.execute(stmt)
        admin = result.scalars().first()
        
        if not admin:
            admin_pass = get_password_hash("Admin@123")
            admin = User(
                id=str(uuid.uuid4()), 
                phone_number="9999999999", 
                email="hospital_admin@example.com", 
                hashed_password=admin_pass, 
                role=Role.HEALTH_WORKER,
                managed_facility_id=hospital.id
            )
            admin_prof = UserProfile(
                id=str(uuid.uuid4()), 
                user_id=admin.id, 
                full_name="Hospital Admin", 
                date_of_birth=date(1980, 5, 15), 
                gender=Gender.MALE, 
                village_town="City Center", 
                district="Metropolis", 
                state="State"
            )
            db.add_all([admin, admin_prof])
            print("Hospital admin created.")
        else:
            admin.managed_facility_id = hospital.id
            admin.role = Role.HEALTH_WORKER
            print("Hospital admin already exists, updated facility id.")

        # Create more doctors
        doctors = [
            Doctor(id=str(uuid.uuid4()), facility_id=hospital.id, name="Dr. Patel", specialization="Pediatrician", experience_years=8, consultation_fee=600, languages="English, Gujarati"),
            Doctor(id=str(uuid.uuid4()), facility_id=hospital.id, name="Dr. Reddy", specialization="Cardiologist", experience_years=20, consultation_fee=1000, languages="English, Telugu"),
            Doctor(id=str(uuid.uuid4()), facility_id=hospital.id, name="Dr. Gupta", specialization="Gynecologist", experience_years=12, consultation_fee=800, languages="English, Hindi"),
            Doctor(id=str(uuid.uuid4()), facility_id=hospital.id, name="Dr. Kumar", specialization="General Surgeon", experience_years=10, consultation_fee=700, languages="English, Hindi, Telugu")
        ]
        db.add_all(doctors)
        
        await db.commit()
        print(f"Added {len(doctors)} doctors and updated admin.")

if __name__ == "__main__":
    asyncio.run(seed_new_data())
