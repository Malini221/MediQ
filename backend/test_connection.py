import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def main():
    load_dotenv()
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("FAIL: DATABASE_URL not found")
        return
        
    try:
        # asyncpg requires postgresql:// scheme
        db_url = db_url.replace("postgres://", "postgresql://")
        conn = await asyncpg.connect(db_url)
        print("PASS")
        await conn.close()
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    asyncio.run(main())
