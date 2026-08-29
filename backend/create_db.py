import asyncio
import asyncpg

async def create_db():
    conn = await asyncpg.connect(user='postgres', password='EventAdmin1234', database='postgres', host='localhost')
    try:
        await conn.execute('CREATE DATABASE sehatsetu')
        print("Database created")
    except asyncpg.exceptions.DuplicateDatabaseError:
        print("Database already exists")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_db())
