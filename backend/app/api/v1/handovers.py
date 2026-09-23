from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.schemas.handover import HandoverResponse

router = APIRouter()

@router.get("/{handover_id}", response_model=HandoverResponse)
async def get_handover(
    handover_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        response = client.table("handover_summaries").select("*").eq("id", str(handover_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Handover not found or unauthorized")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{handover_id}/acknowledge", response_model=HandoverResponse)
async def acknowledge_handover(
    handover_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        # First verify the handover exists and user has access
        response = client.table("handover_summaries").select("*").eq("id", str(handover_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Handover not found or unauthorized")
        
        handover = response.data[0]
        
        # If already acknowledged, we can just return it or let it update (idempotent)
        if handover.get("acknowledged_by"):
            return handover
            
        # Update acknowledged_by
        update_resp = client.table("handover_summaries").update({
            "acknowledged_by": user_id
        }).eq("id", str(handover_id)).execute()
        
        if not update_resp.data:
            raise HTTPException(status_code=403, detail="Failed to acknowledge handover")
            
        return update_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
