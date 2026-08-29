import asyncio
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.user import User

async def check():
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.phone_number == "9999999999")
        result = await db.execute(stmt)
        u = result.scalars().first()
        if u:
            print(f"Role: {u.role}, Facility: {u.managed_facility_id}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check())
