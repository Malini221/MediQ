from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.core.security import get_current_user
from app.schemas.clinical_guidance import ClinicalGuidanceResult
from app.ai.clinical_guidance import retrieve_clinical_guidance

router = APIRouter()

@router.get("/search", response_model=List[ClinicalGuidanceResult])
async def search_clinical_guidance(
    query: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    user_id: str = Depends(get_current_user)
):
    try:
        results = await retrieve_clinical_guidance(query, limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
