import asyncio
import asyncpg
from app.core.config import settings

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    conn = await asyncpg.connect(db_url)
    
    # 1. Current publication configuration
    print("=== CURRENT PUBLICATIONS ===")
    pubs = await conn.fetch("SELECT * FROM pg_publication;")
    for pub in pubs:
        print(dict(pub))
        
    # 2. Existing tables in supabase_realtime
    print("\n=== SUPABASE_REALTIME TABLES ===")
    tables = await conn.fetch("SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';")
    for t in tables:
        print(dict(t))
        
    # 3. Existing RLS policies relevant to observations, handover_summaries, patients, patient_memberships
    print("\n=== RLS POLICIES ===")
    policies = await conn.fetch("""
        SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename IN ('observations', 'handover_summaries', 'patients', 'patient_memberships');
    """)
    for p in policies:
        print(f"Table: {p['tablename']} | Policy: {p['policyname']} | Cmd: {p['cmd']}")
        print(f"  USING: {p['qual']}")
        if p['with_check']:
            print(f"  WITH CHECK: {p['with_check']}")
        print("---")
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
