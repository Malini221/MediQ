from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.schemas.burnout import BurnoutLogResponse
from app.ai.burnout_detection import calculate_strain_signal

router = APIRouter()

@router.get("", response_model=List[BurnoutLogResponse])
async def get_burnout_root(
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    """Return the authenticated caregiver's private strain history."""
    try:
        response = client.table("burnout_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(30).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load support metrics") from e

@router.get("/me", response_model=List[BurnoutLogResponse])
async def get_my_burnout_logs(
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    """Retrieve only the authenticated user's own burnout/strain logs."""
    try:
        response = client.table("burnout_logs").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=BurnoutLogResponse, status_code=status.HTTP_201_CREATED)
async def analyze_burnout(
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    """Analyze recent activity and store a new strain/support signal log."""
    try:
        # Fetch user's recent observations
        obs_resp = client.table("observations").select("*").eq("recorded_by", user_id).order("created_at", desc=True).limit(20).execute()
        observations = obs_resp.data
        
        # Calculate signal
        analysis = calculate_strain_signal(observations)
        
        # Store in DB
        insert_data = {
            "user_id": user_id,
            "strain_score": analysis["strain_score"],
            "sentiment_indicators": analysis["sentiment_indicators"],
            "usage_frequency_metrics": analysis["usage_frequency_metrics"],
            "intervention_offered": analysis["intervention_offered"]
        }
        
        insert_resp = client.table("burnout_logs").insert(insert_data).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create burnout log")
            
        return insert_resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
