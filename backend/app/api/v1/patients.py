from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import get_current_user, security
from app.core.config import settings
from supabase import create_client, ClientOptions
from app.schemas.patient import PatientResponse
from app.schemas.observation import ObservationResponse
from uuid import UUID

router = APIRouter()

def get_user_supabase_client(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Returns a configured Supabase Client that inherits the user's JWT.
    This ensures that Row Level Security (RLS) is automatically enforced 
    at the database layer for all operations without duplicating policies.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # By passing the Authorization header directly into PostgREST via ClientOptions,
    # the remote Postgres instance will strictly apply the user's RLS context.
    options = ClientOptions(headers={"Authorization": f"Bearer {credentials.credentials}"})
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, options=options)

@router.get("", response_model=list[PatientResponse])
async def get_patients(
    user_id: str = Depends(get_current_user), 
    client = Depends(get_user_supabase_client)
):
    """
    Retrieve all patients the authenticated user is allowed to access.
    RLS inherently filters the returned rows based on `patient_memberships`.
    """
    try:
        response = client.table("patients").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID, 
    user_id: str = Depends(get_current_user), 
    client = Depends(get_user_supabase_client)
):
    """
    Retrieve a specific patient by ID.
    If the user has no membership, RLS denies access, causing the result to be empty.
    We return 404 to avoid leaking the existence of unauthorized patients.
    """
    try:
        response = client.table("patients").select("*").eq("id", str(patient_id)).execute()
        if not response.data:
            # Enforce Patient Isolation - return 404 (Not Found) if unauthorized
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    payload: dict,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    """Update condition/profile fields for an authorized patient membership."""
    allowed = {}
    if "primary_diagnosis" in payload and isinstance(payload["primary_diagnosis"], str):
        allowed["primary_diagnosis"] = payload["primary_diagnosis"].strip()
    if "baseline_conditions" in payload and isinstance(payload["baseline_conditions"], dict):
        allowed["baseline_conditions"] = payload["baseline_conditions"]
    if not allowed:
        raise HTTPException(status_code=400, detail="No supported patient fields supplied")
    try:
        response = client.table("patients").update(allowed).eq("id", str(patient_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=403, detail="Patient update is not permitted") from e

@router.get("/{patient_id}/observations", response_model=list[ObservationResponse])
async def get_patient_observations(
    patient_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    """
    Retrieve all observations for a specific patient.
    """
    try:
        # First verify the patient is accessible
        patient_check = client.table("patients").select("id, primary_diagnosis").eq("id", str(patient_id)).execute()
        if not patient_check.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
            
        response = client.table("observations").select("*").eq("patient_id", str(patient_id)).execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas.handover import HandoverResponse
from app.ai import handover_generation

@router.post("/{patient_id}/handover", response_model=HandoverResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_handover(
    patient_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        # 1. Authorize patient
        patient_check = client.table("patients").select("id, primary_diagnosis").eq("id", str(patient_id)).execute()
        if not patient_check.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
            
        # 2. Retrieve recent observations
        obs_resp = client.table("observations").select("*").eq("patient_id", str(patient_id)).eq("status", "pending").execute()
        observations = obs_resp.data
        
        if not observations:
            raise HTTPException(status_code=400, detail="No observations available to generate handover")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # 3. Generate Handover Summary
    handover_data = handover_generation.generate_handover_summary(observations, patient_check.data[0].get("primary_diagnosis"))
    
    # 4. Store in DB
    try:
        insert_data = {
            "patient_id": str(patient_id),
            "created_by": user_id,
            "summary_text": handover_data["summary_text"],
            "source_observation_ids": handover_data["source_observation_ids"],
            "priority_watch_items": handover_data["priority_watch_items"]
        }
        
        insert_resp = client.table("handover_summaries").insert(insert_data).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=403, detail="Failed to create handover summary")
            
        return insert_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{patient_id}/handovers", response_model=list[HandoverResponse])
async def get_patient_handovers(
    patient_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        patient_check = client.table("patients").select("id").eq("id", str(patient_id)).execute()
        if not patient_check.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
            
        response = client.table("handover_summaries").select("*").eq("patient_id", str(patient_id)).execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

