import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine, AsyncSessionLocal, Base
from app.models.user import User, UserProfile, Role, Gender
from app.models.facility import HealthcareFacility, Service
from app.models.doctor import Doctor
from app.models.health_info import HealthInformation
from app.utils.security import get_password_hash
from datetime import date
import uuid

async def seed():
    async with AsyncSessionLocal() as db:
        # Create Demo Users
        admin_pass = get_password_hash("Demo@123")
        patient_pass = get_password_hash("Demo@123")
        
        # Create Facilities
        hospital = HealthcareFacility(
            id=str(uuid.uuid4()),
            name="District General Hospital",
            type="Hospital",
            address="Main Road, Near Bus Stand",
            city="Vizianagaram",
            district="Vizianagaram",
            state="Andhra Pradesh",
            latitude=18.1067,
            longitude=83.3956,
            is_24_7=True,
            has_emergency=True
        )

        # Admin
        admin = User(id=str(uuid.uuid4()), phone_number="9999999999", email="admin@example.com", hashed_password=admin_pass, role=Role.ADMIN, managed_facility_id=hospital.id)
        admin_prof = UserProfile(id=str(uuid.uuid4()), user_id=admin.id, full_name="System Admin", date_of_birth=date(1980, 1, 1), gender=Gender.OTHER, village_town="City", district="Dist", state="State")
        
        # Patient
        patient = User(id=str(uuid.uuid4()), phone_number="8888888888", email="patient@example.com", hashed_password=patient_pass, role=Role.PATIENT)
        patient_prof = UserProfile(id=str(uuid.uuid4()), user_id=patient.id, full_name="Raju Demo", date_of_birth=date(1990, 5, 12), gender=Gender.MALE, village_town="Rampur", district="Vizianagaram", state="Andhra Pradesh")
        
        db.add_all([admin, admin_prof, patient, patient_prof])
        
        phc = HealthcareFacility(
            id=str(uuid.uuid4()),
            name="Rampur Primary Health Centre",
            type="Primary Health Centre",
            address="Village Center",
            city="Rampur",
            district="Vizianagaram",
            state="Andhra Pradesh",
            latitude=18.1200,
            longitude=83.4000,
            is_24_7=False,
            has_emergency=False,
            opening_hours="09:00 AM - 05:00 PM"
        )
        
        db.add_all([hospital, phc])
        
        # Create Doctors
        dr1 = Doctor(
            id=str(uuid.uuid4()),
            facility_id=hospital.id,
            name="Dr. Sharma",
            specialization="General Medicine",
            experience_years=10,
            languages="English, Hindi, Telugu"
        )
        db.add(dr1)
        
        # Create Health Info
        info1 = HealthInformation(
            id=str(uuid.uuid4()),
            category="Fever",
            title="Understanding Fever",
            description="A fever is a temporary increase in your body temperature, often due to an illness.",
            symptoms="Sweating, chills, shivering, headache, muscle aches, loss of appetite, irritability, dehydration, general weakness.",
            general_precautions="Drink plenty of fluids, rest, stay cool.",
            when_to_seek_care="If temperature is 103 F (39.4 C) or higher, or lasts more than 3 days.",
            emergency_warning_signs="Severe headache, stiff neck, shortness of breath, confusion, seizures."
        )
        db.add(info1)
        
        await db.commit()
        print("Database seeded successfully with demo data.")

if __name__ == "__main__":
    asyncio.run(seed())
