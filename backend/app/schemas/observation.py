from pydantic import BaseModel, ConfigDict
from typing import Any, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class ObservationStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    escalated = "escalated"

class ObservationCreate(BaseModel):
    patient_id: UUID
    raw_text: str
    original_audio_path: Optional[str] = None

class ObservationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    recorded_by: UUID
    original_audio_path: Optional[str] = None
    raw_text: str
    extracted_metadata: dict[str, Any] = {}
    status: ObservationStatus
    priority_score: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
