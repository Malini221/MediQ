from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client

router = APIRouter()

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    return {"id": user_id}

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user), client = Depends(get_user_supabase_client)):
    try:
        response = client.table("profiles").select("*").eq("id", user_id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found") from e

@router.patch("/profile")
async def update_profile(payload: dict, user_id: str = Depends(get_current_user), client = Depends(get_user_supabase_client)):
    allowed = {}
    language = payload.get("preferred_voice_language")
    if language is not None:
        if language not in {"en", "hi", "ta", "te"}:
            raise HTTPException(status_code=400, detail="Unsupported voice language")
        allowed["preferred_voice_language"] = language
    if "full_name" in payload and isinstance(payload["full_name"], str):
        allowed["full_name"] = payload["full_name"].strip()
    if not allowed:
        raise HTTPException(status_code=400, detail="No supported profile fields supplied")
    try:
        response = client.table("profiles").update(allowed).eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=403, detail="Profile update is not permitted") from e
