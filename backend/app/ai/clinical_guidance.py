import logging
from typing import List, Dict, Any
from sqlalchemy import text
from app.db.database import AsyncSessionLocal
from app.ai.embeddings import get_embedding_provider
from app.schemas.clinical_guidance import ClinicalGuidanceResult

logger = logging.getLogger(__name__)


async def _keyword_guidance_search(query_text: str, limit: int) -> List[ClinicalGuidanceResult]:
    """Reliable local fallback for demo/development when embeddings are unavailable."""
    query = text("""
        SELECT id, category, title, content, metadata
        FROM clinical_guidance
        WHERE is_approved = TRUE
          AND (
            title ILIKE :pattern
            OR content ILIKE :pattern
            OR category ILIKE :pattern
          )
        ORDER BY updated_at DESC
        LIMIT :limit
    """)
    pattern = f"%{query_text.strip()}%"
    async with AsyncSessionLocal() as session:
        res = await session.execute(query, {"pattern": pattern, "limit": limit})
        rows = res.fetchall()

    # If an exact keyword match is unavailable, return the approved library in
    # a deterministic order rather than showing a broken/empty guidance page.
    if not rows:
        async with AsyncSessionLocal() as session:
            res = await session.execute(text("""
                SELECT id, category, title, content, metadata
                FROM clinical_guidance
                WHERE is_approved = TRUE
                ORDER BY updated_at DESC
                LIMIT :limit
            """), {"limit": limit})
            rows = res.fetchall()

    return [
        ClinicalGuidanceResult(
            id=row.id,
            category=row.category,
            title=row.title,
            content=row.content,
            metadata=row.metadata,
            similarity_score=0.0,
        )
        for row in rows
    ]


async def retrieve_clinical_guidance(query_text: str, limit: int = 5) -> List[ClinicalGuidanceResult]:
    """
    Retrieve approved guidance with local SentenceTransformer + pgvector when
    embeddings are available. Fall back to deterministic keyword retrieval so
    the feature remains usable on a fresh college/demo machine before the model
    has been downloaded or guidance embeddings have been generated.
    """
    if not query_text:
        return []

    try:
        provider = get_embedding_provider()
        embedding = provider.embed_text(query_text)
        vector_literal = "[" + ",".join(str(f) for f in embedding) + "]"

        query = text("""
            SELECT
                id, category, title, content, metadata,
                1 - (embedding <=> :vector) AS similarity_score
            FROM clinical_guidance
            WHERE is_approved = TRUE
              AND embedding IS NOT NULL
            ORDER BY embedding <=> :vector
            LIMIT :limit
        """)

        async with AsyncSessionLocal() as session:
            res = await session.execute(query, {"vector": vector_literal, "limit": limit})
            rows = res.fetchall()

        if rows:
            return [
                ClinicalGuidanceResult(
                    id=row.id,
                    category=row.category,
                    title=row.title,
                    content=row.content,
                    metadata=row.metadata,
                    similarity_score=float(row.similarity_score),
                )
                for row in rows
            ]
    except Exception as exc:
        logger.warning("Semantic guidance retrieval unavailable; using local fallback: %s", exc)

    return await _keyword_guidance_search(query_text, limit)


async def retrieve_guidance_for_observation(raw_text: str, extracted_metadata: Dict[str, Any]) -> List[ClinicalGuidanceResult]:
    """Build a guidance query from observation text and extracted symptoms."""
    query = raw_text
    symptoms = extracted_metadata.get("symptoms", [])
    if symptoms:
        query += " " + " ".join(symptoms)

    return await retrieve_clinical_guidance(query)
