import logging
from typing import List, Dict, Any
from sqlalchemy import text
from app.db.database import AsyncSessionLocal
from app.ai.embeddings import get_embedding_provider
from app.schemas.clinical_guidance import ClinicalGuidanceResult

logger = logging.getLogger(__name__)

async def retrieve_clinical_guidance(query_text: str, limit: int = 5) -> List[ClinicalGuidanceResult]:
    """
    Generate embedding for the query and retrieve semantically similar approved clinical guidance.
    Uses pgvector `<=>` cosine distance.
    """
    if not query_text:
        return []
        
    provider = get_embedding_provider()
    embedding = provider.embed_text(query_text)
    
    # Cosine distance is 1 - similarity. Score is 1 - distance.
    query = text("""
        SELECT 
            id, category, title, content, metadata,
            1 - (embedding <=> :vector) AS similarity_score
        FROM clinical_guidance
        WHERE is_approved = TRUE
        ORDER BY embedding <=> :vector
        LIMIT :limit
    """)
    
    # We format the vector list as a Postgres vector literal '[1.0, 2.0, ...]'
    vector_literal = "[" + ",".join(str(f) for f in embedding) + "]"
    
    results = []
    async with AsyncSessionLocal() as session:
        # Run query
        res = await session.execute(query, {"vector": vector_literal, "limit": limit})
        rows = res.fetchall()
        for row in rows:
            results.append(ClinicalGuidanceResult(
                id=row.id,
                category=row.category,
                title=row.title,
                content=row.content,
                metadata=row.metadata,
                similarity_score=float(row.similarity_score)
            ))
            
    return results

async def retrieve_guidance_for_observation(raw_text: str, extracted_metadata: Dict[str, Any]) -> List[ClinicalGuidanceResult]:
    """
    Convenience method for the observation workflow.
    Ensures patient private data is abstracted into a clinical query.
    """
    query = raw_text
    symptoms = extracted_metadata.get("symptoms", [])
    if symptoms:
        query += " " + " ".join(symptoms)
        
    return await retrieve_clinical_guidance(query)
