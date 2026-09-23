from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime

class HandoverResponse(BaseModel):
    id: UUID
    patient_id: UUID
    created_by: UUID
    summary_text: str
    source_observation_ids: List[UUID]
    priority_watch_items: dict[str, Any]
    acknowledged_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
