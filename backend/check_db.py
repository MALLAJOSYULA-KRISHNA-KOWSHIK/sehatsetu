import asyncio
from app.database import AsyncSessionLocal
from app.models.appointment import Appointment
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Appointment).order_by(Appointment.created_at.desc()).limit(1))
        appt = res.scalars().first()
        if appt:
            print(f"Appt ID: {appt.id}, is_escalated: {appt.is_escalated}, urgency: {appt.urgency_level}")
        else:
            print("No appointments found")

if __name__ == "__main__":
    asyncio.run(main())
