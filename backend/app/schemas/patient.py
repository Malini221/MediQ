from pydantic import BaseModel
from typing import Any
from datetime import date, datetime
from uuid import UUID

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    primary_diagnosis: str
    baseline_conditions: dict[str, Any]

class PatientResponse(PatientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
