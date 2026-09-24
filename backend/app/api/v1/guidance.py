from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client

router = APIRouter()


@router.get("/search")
async def search_clinical_guidance(
    query: str,
    limit: int = 5,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    """Search approved guidance without requiring a paid external search service.

    The first implementation uses PostgreSQL full-text/keyword matching so the
    feature works even when the optional vector index has no seeded embeddings.
    """
    query = query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query is required")

    limit = max(1, min(limit, 10))
    try:
        response = (
            client.table("clinical_guidance")
            .select("id, category, title, content, metadata, is_approved")
            .eq("is_approved", True)
            .or_(f"title.ilike.%{query}%,content.ilike.%{query}%,category.ilike.%{query}%")
            .limit(limit)
            .execute()
        )
        rows = response.data or []
        return [
            {**row, "similarity_score": None}
            for row in rows
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to search the approved guidance library") from exc
