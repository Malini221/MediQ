import asyncio
import asyncpg
from app.core.config import settings

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    conn = await asyncpg.connect(db_url)
    
    print("Checking current tables in supabase_realtime...")
    tables = await conn.fetch("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';")
    existing_tables = [t['tablename'] for t in tables]
    
    if 'observations' not in existing_tables:
        print("Adding observations to supabase_realtime...")
        await conn.execute("ALTER PUBLICATION supabase_realtime ADD TABLE observations;")
    else:
        print("observations already in supabase_realtime.")
        
    if 'handover_summaries' not in existing_tables:
        print("Adding handover_summaries to supabase_realtime...")
        await conn.execute("ALTER PUBLICATION supabase_realtime ADD TABLE handover_summaries;")
    else:
        print("handover_summaries already in supabase_realtime.")
        
    await conn.close()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
