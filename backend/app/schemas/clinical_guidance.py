from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID

class ClinicalGuidanceResult(BaseModel):
    id: UUID
    category: str
    title: str
    content: str
    metadata: Dict[str, Any]
    similarity_score: float

    model_config = ConfigDict(from_attributes=True)
