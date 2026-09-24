from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import tempfile
import os
from uuid import UUID
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.ai import speech_to_text, observation_extraction
from app.ai.priority_engine import assess_priority
from app.safety.emergency_detector import detect_safety

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/webm", "video/webm"]


async def _get_authorized_observation(observation_id: UUID, client):
    response = client.table("observations").select("*").eq("id", str(observation_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
    return response.data[0]


@router.post("/{observation_id}/audio", response_model=ObservationResponse)
async def upload_observation_audio(
    observation_id: UUID,
    file: UploadFile = File(...),
    language: str = Form("en"),
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    if language not in {"en", "hi", "ta", "te"}:
        raise HTTPException(status_code=400, detail="Unsupported voice language")
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid audio file format")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Audio file too large")

    obs = await _get_authorized_observation(observation_id, client)
    patient_id = obs["patient_id"]
    storage_path = f"observations/{patient_id}/{observation_id}/{file.filename or 'observation.webm'}"

    try:
        client.storage.from_("caregiver_audio").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Audio storage is not available. Please try again.") from exc

    transcription = ""
    try:
        suffix = os.path.splitext(file.filename or "observation.webm")[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            transcription = speech_to_text.transcribe_audio(tmp_path, language=language)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as exc:
        transcription = "[Voice transcription unavailable; original audio is preserved.]"

    safety = detect_safety(transcription)
    try:
        metadata = observation_extraction.extract_metadata(transcription) if transcription and not transcription.startswith("[") else {}
    except Exception:
        metadata = {}
    try:
        priority = assess_priority(transcription, metadata)
        priority_score = priority.priority_score
        metadata.update({"safety": safety, "voice_language": language})
    except Exception:
        priority_score = safety["priority_score"]
        metadata.update({"safety": safety, "voice_language": language})

    new_raw_text = (obs.get("raw_text") or "").replace("[Patient Voice Report] Audio pending transcription.", "").strip()
    if transcription:
        new_raw_text = (new_raw_text + "\n" if new_raw_text else "") + "[Audio Transcription]: " + transcription

    try:
        update_resp = client.table("observations").update({
            "original_audio_path": storage_path,
            "raw_text": new_raw_text,
            "extracted_metadata": {**(obs.get("extracted_metadata") or {}), **metadata},
            "priority_score": priority_score,
        }).eq("id", str(observation_id)).execute()
        if not update_resp.data:
            raise HTTPException(status_code=404, detail="Observation not found")
        return update_resp.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to save the voice report") from exc


@router.get("/{observation_id}/audio-url")
async def get_observation_audio_url(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    obs = await _get_authorized_observation(observation_id, client)
    path = obs.get("original_audio_path")
    if not path:
        raise HTTPException(status_code=404, detail="No audio is attached to this observation")
    try:
        signed = client.storage.from_("caregiver_audio").create_signed_url(path, 3600)
        url = signed.get("signedURL") or signed.get("signedUrl")
        if not url:
            raise HTTPException(status_code=500, detail="Unable to create audio playback URL")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to prepare audio playback") from exc


@router.post("/{observation_id}/analyze", response_model=ObservationResponse)
async def analyze_observation(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    obs = await _get_authorized_observation(observation_id, client)
    raw_text = obs.get("raw_text", "")
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Cannot analyze empty observation text")
    metadata = observation_extraction.extract_metadata(raw_text)
    safety = detect_safety(raw_text)
    priority = assess_priority(raw_text, metadata)
    metadata["safety"] = safety
    response = client.table("observations").update({
        "extracted_metadata": {**(obs.get("extracted_metadata") or {}), **metadata},
        "priority_score": priority.priority_score,
    }).eq("id", str(observation_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Observation not found")
    return response.data[0]


@router.post("/{observation_id}/priority")
async def evaluate_priority(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    obs = await _get_authorized_observation(observation_id, client)
    assessment = assess_priority(obs.get("raw_text", ""), obs.get("extracted_metadata") or {})
    safety = detect_safety(obs.get("raw_text", ""))
    return {
        **assessment.model_dump(),
        "safety": safety,
    }


@router.post("", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
async def create_observation(
    observation: ObservationCreate,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    try:
        patient_resp = client.table("patients").select("id, primary_diagnosis").eq("id", str(observation.patient_id)).execute()
        if not patient_resp.data:
            raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        condition = patient_resp.data[0].get("primary_diagnosis") or "General care"
        raw_text = observation.raw_text.strip()
        safety = detect_safety(raw_text)
        metadata = {"condition_context": condition, "safety": safety}
        try:
            metadata.update(observation_extraction.extract_metadata(raw_text))
        except Exception:
            pass
        priority = assess_priority(raw_text, metadata)
        data = {
            "patient_id": str(observation.patient_id),
            "recorded_by": user_id,
            "raw_text": raw_text,
            "original_audio_path": observation.original_audio_path,
            "status": "pending",
            "priority_score": priority.priority_score,
            "extracted_metadata": metadata,
        }
        response = client.table("observations").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=403, detail="Unauthorized to submit observation for this patient")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=403, detail="Unauthorized to submit observation for this patient") from exc


@router.get("/{observation_id}", response_model=ObservationResponse)
async def get_observation(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    return await _get_authorized_observation(observation_id, client)


@router.patch("/{observation_id}/confirm", response_model=ObservationResponse)
async def confirm_observation(
    observation_id: UUID,
    user_id: str = Depends(get_current_user),
    client=Depends(get_user_supabase_client),
):
    await _get_authorized_observation(observation_id, client)
    response = client.table("observations").update({"status": "confirmed"}).eq("id", str(observation_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Observation not found or unauthorized")
    return response.data[0]
