from pydantic import BaseModel, Field
from typing import List
from enum import Enum

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class PriorityAssessment(BaseModel):
    severity: SeverityLevel = Field(..., description="Calculated urgency of the observation")
    priority_score: int = Field(..., description="Numeric score (0-100) compatible with database")
    safety_flags: List[str] = Field(default_factory=list, description="Specific critical safety rules triggered")
    escalation_required: bool = Field(False, description="Whether immediate escalation is necessary")
    rationale: str = Field(..., description="Explainable reason for the assigned score")
