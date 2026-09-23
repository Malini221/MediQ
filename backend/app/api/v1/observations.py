from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import tempfile
import os
from typing import List
from uuid import UUID
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.ai import speech_to_text

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/webm", "video/webm"]

@router.post("/{observation_id}/audio", response_model=ObservationResponse)
async def upload_observation_audio(
    observation_id: UUID,
    file: UploadFile = File(...),
    language: str = Form("en"),
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    if language not in {"en", "hi", "ta", "te"}:
        raise HTTPException(status_code=400, detail="Unsupported voice language")

    # 1. Validate file format
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid audio file format")
        
    # 2. Validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Audio file too large")
        
    # 3. Authorize user and get patient_id via RLS
    try:
        obs_resp = client.table("observations").select("*").eq("id", str(observation_id)).execute()
        if not obs_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
        obs = obs_resp.data[0]
        patient_id = obs["patient_id"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # 4. Upload to Supabase Storage securely
    storage_path = f"observations/{patient_id}/{observation_id}/{file.filename}"
    try:
        # Pushing to the existing storage structure natively
        client.storage.from_("caregiver_audio").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type}
        )
    except Exception as e:
        # Note: If bucket doesn't exist, this fails safely.
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # 5. Transcribe Audio using local Faster-Whisper
    transcription = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        
        transcription = speech_to_text.transcribe_audio(tmp_path, language=language)
        os.remove(tmp_path)
    except Exception as e:
        # Fallback gracefully if transcription fails so observation is still recorded
        transcription = f"[Transcription failed: {str(e)}]"

    # 6. Update Database
    new_raw_text = obs.get("raw_text", "")
    if not new_raw_text or new_raw_text.strip() == "":
        new_raw_text = transcription
    else:
        new_raw_text = new_raw_text + "\n[Audio Transcription]: " + transcription

    try:
        # Status deliberately remains 'pending', and we do not touch priority_score.
        update_resp = client.table("observations").update({
            "original_audio_path": storage_path,
            "raw_text": new_raw_text,
            "extracted_metadata": {**(obs.get("extracted_metadata") or {}), "voice_language": language}
        }).eq("id", str(observation_id)).execute()
        
        if not update_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found")
        return update_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.ai import observation_extraction

@router.post("/{observation_id}/analyze", response_model=ObservationResponse)
async def analyze_observation(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        # 1. Authorize user and get observation
        obs_resp = client.table("observations").select("*").eq("id", str(observation_id)).execute()
        if not obs_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
        obs = obs_resp.data[0]
        
        # 2. Validate text
        raw_text = obs.get("raw_text", "")
        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=400, detail="Cannot analyze empty observation text")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # 3. Run extraction securely
    metadata = observation_extraction.extract_metadata(raw_text)
    
    # 4. Save to Database (Status MUST remain untouched/pending)
    try:
        metadata = {**(obs.get("extracted_metadata") or {}), **metadata}
        update_resp = client.table("observations").update({
            "extracted_metadata": metadata
        }).eq("id", str(observation_id)).execute()
        
        if not update_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found")
        return update_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas.priority import PriorityAssessment
from app.ai.priority_engine import assess_priority

@router.post("/{observation_id}/priority", response_model=PriorityAssessment)
async def evaluate_priority(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        # 1. Authorize user and get observation
        obs_resp = client.table("observations").select("*").eq("id", str(observation_id)).execute()
        if not obs_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
        obs = obs_resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # 2. Run deterministic priority engine
    raw_text = obs.get("raw_text", "")
    extracted_metadata = obs.get("extracted_metadata") or {}
    
    assessment = assess_priority(raw_text, extracted_metadata)
    
    # 3. Update priority_score in DB (do NOT modify status automatically)
    try:
        update_resp = client.table("observations").update({
            "priority_score": assessment.priority_score
        }).eq("id", str(observation_id)).execute()
        
        if not update_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found")
            
        # Return the assessment directly, not the DB observation
        return assessment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
async def create_observation(
    observation: ObservationCreate,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        patient_resp = client.table("patients").select("id, primary_diagnosis").eq("id", str(observation.patient_id)).execute()
        if not patient_resp.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        condition = patient_resp.data[0].get("primary_diagnosis") or "General care"
        data = {
            "patient_id": str(observation.patient_id),
            "recorded_by": user_id,
            "raw_text": observation.raw_text,
            "original_audio_path": observation.original_audio_path,
            "status": "pending",
            "priority_score": 0,
            "extracted_metadata": {"condition_context": condition}
        }
        
        # PostgREST Insert will fail RLS if user is not authorized to insert for this patient
        response = client.table("observations").insert(data).execute()
        if not response.data:
            # If RLS denies the insert, response.data will be empty
            raise HTTPException(status_code=403, detail="Unauthorized to submit observation for this patient")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        if "404" in str(e):
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        raise HTTPException(status_code=403, detail="Unauthorized to submit observation for this patient")

@router.get("/{observation_id}", response_model=ObservationResponse)
async def get_observation(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        response = client.table("observations").select("*").eq("id", str(observation_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{observation_id}/confirm", response_model=ObservationResponse)
async def confirm_observation(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client = Depends(get_user_supabase_client)
):
    try:
        response = client.table("observations").update({"status": "confirmed"}).eq("id", str(observation_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
