from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from app.core.security import get_current_user, security
from app.core.config import settings
from supabase import create_client, ClientOptions
from app.schemas.patient import PatientResponse
from app.schemas.observation import ObservationResponse
from uuid import UUID

router = APIRouter()

CAREGIVER_ROLES = {"family_caregiver", "professional_caregiver", "clinician", "coordinator"}


def get_user_supabase_client(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Return a Supabase client carrying the signed-in user's JWT so RLS remains authoritative."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")

    options = ClientOptions(headers={"Authorization": f"Bearer {credentials.credentials}"})
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, options=options)


def ensure_demo_caregiver_access(user_id: str) -> None:
    """
    Development/demo bootstrap only.

    The prototype does not yet have a coordinator assignment UI. When a verified
    caregiver account reaches the patient API, give that account memberships to
    the synthetic demo patients. The actual data query still uses the user's JWT
    and RLS client. Production should replace this with explicit assignments.
    """
    if settings.ENVIRONMENT != "development":
        return

    try:
        admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        profile_resp = admin.table("profiles").select("system_role, full_name").eq("id", user_id).maybe_single().execute()
        profile = profile_resp.data if profile_resp else None

        # A real profile is authoritative. Only accounts created before profile
        # provisioning fall back to verified Auth metadata.
        if profile:
            role = profile.get("system_role")
            full_name = profile.get("full_name") or "MediQ Caregiver"
        else:
            auth_user = admin.auth.admin.get_user_by_id(user_id)
            role = ((auth_user.user.user_metadata or {}).get("system_role") if auth_user and auth_user.user else None)
            full_name = ((auth_user.user.user_metadata or {}).get("full_name") if auth_user and auth_user.user else None) or "MediQ Caregiver"

        if role not in CAREGIVER_ROLES:
            return

        admin.table("profiles").upsert({
            "id": user_id,
            "full_name": full_name,
            "system_role": role,
        }).execute()

        patients_resp = admin.table("patients").select("id").execute()
        for patient in patients_resp.data or []:
            admin.table("patient_memberships").upsert({
                "user_id": user_id,
                "patient_id": patient["id"],
                "assigned_role": role,
            }, on_conflict="user_id,patient_id").execute()
    except Exception:
        # A bootstrap failure must never turn the dashboard into a 500. Normal
        # RLS access continues to be enforced by the user-scoped client.
        return


@router.get("", response_model=list[PatientResponse])
async def get_patients(
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    ensure_demo_caregiver_access(user_id)
    try:
        response = client.table("patients").select("*").order("full_name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load patients") from e


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    ensure_demo_caregiver_access(user_id)
    try:
        response = client.table("patients").select("*").eq("id", str(patient_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load patient") from e


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    payload: dict,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    ensure_demo_caregiver_access(user_id)
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
    client=Depends(get_user_supabase_client),
):
    ensure_demo_caregiver_access(user_id)
    try:
        patient_check = client.table("patients").select("id, primary_diagnosis").eq("id", str(patient_id)).execute()
        if not patient_check.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        response = client.table("observations").select("*").eq("patient_id", str(patient_id)).order("created_at", desc=True).execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load patient observations") from e


from app.schemas.handover import HandoverResponse
from app.ai import handover_generation


@router.post("/{patient_id}/handover", response_model=HandoverResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_handover(
    patient_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    ensure_demo_caregiver_access(user_id)
    try:
        patient_check = client.table("patients").select("id, primary_diagnosis").eq("id", str(patient_id)).execute()
        if not patient_check.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")

        obs_resp = client.table("observations").select("*").eq("patient_id", str(patient_id)).order("created_at", desc=True).limit(20).execute()
        observations = obs_resp.data
        if not observations:
            raise HTTPException(status_code=400, detail="No observations available to generate handover")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to prepare handover") from e

    handover_data = handover_generation.generate_handover_summary(
        observations,
        patient_check.data[0].get("primary_diagnosis"),
    )

    try:
        insert_data = {
            "patient_id": str(patient_id),
            "created_by": user_id,
            "summary_text": handover_data["summary_text"],
            "source_observation_ids": handover_data["source_observation_ids"],
            "priority_watch_items": handover_data["priority_watch_items"],
        }
        insert_resp = client.table("handover_summaries").insert(insert_data).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=403, detail="Failed to create handover summary")
        return insert_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to save handover summary") from e


@router.get("/{patient_id}/handovers", response_model=list[HandoverResponse])
async def get_patient_handovers(
    patient_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    ensure_demo_caregiver_access(user_id)
    try:
        patient_check = client.table("patients").select("id").eq("id", str(patient_id)).execute()
        if not patient_check.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        response = client.table("handover_summaries").select("*").eq("patient_id", str(patient_id)).order("created_at", desc=True).execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load handovers") from e
