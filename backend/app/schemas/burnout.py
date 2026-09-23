from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class BurnoutLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    strain_score: int = Field(..., ge=0, le=100, description="Bounded strain score (0-100)")
    sentiment_indicators: Dict[str, Any]
    usage_frequency_metrics: Dict[str, Any]
    intervention_offered: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
