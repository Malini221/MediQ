import logging
from typing import Dict, Any
from app.schemas.priority import PriorityAssessment, SeverityLevel

logger = logging.getLogger(__name__)

# Deterministic safety rules for critical indicators
CRITICAL_KEYWORDS = [
    "unresponsive", "stopped breathing", "severe bleeding", "no pulse",
    "emergency", "911", "choking", "seizure", "heart attack", "stroke"
]

HIGH_KEYWORDS = [
    "chest pain", "difficulty breathing", "high fever", "confused",
    "fainted", "hallucinating", "severe pain", "allergic reaction"
]

MEDIUM_KEYWORDS = [
    "mild fever", "cough", "nausea", "dizzy", "vomiting", "diarrhea",
    "rash", "headache", "agitated"
]

def assess_priority(raw_text: str, extracted_metadata: Dict[str, Any]) -> PriorityAssessment:
    """
    Evaluates observation data and produces a deterministic priority assessment.
    Does NOT diagnose or prescribe.
    """
    if not raw_text:
        raw_text = ""
        
    text_lower = raw_text.lower()
    
    # 1. Check for Critical conditions
    matched_critical = [kw for kw in CRITICAL_KEYWORDS if kw in text_lower]
    if matched_critical:
        return PriorityAssessment(
            severity=SeverityLevel.CRITICAL,
            priority_score=100,
            safety_flags=matched_critical,
            escalation_required=True,
            rationale=f"Critical safety rules triggered by phrases: {', '.join(matched_critical)}."
        )
        
    # 2. Check for High conditions
    matched_high = [kw for kw in HIGH_KEYWORDS if kw in text_lower]
    if matched_high:
        return PriorityAssessment(
            severity=SeverityLevel.HIGH,
            priority_score=75,
            safety_flags=matched_high,
            escalation_required=False,
            rationale=f"High urgency indicated by phrases: {', '.join(matched_high)}."
        )
        
    # 3. Check for Medium conditions
    matched_medium = [kw for kw in MEDIUM_KEYWORDS if kw in text_lower]
    if matched_medium:
        return PriorityAssessment(
            severity=SeverityLevel.MEDIUM,
            priority_score=50,
            safety_flags=[],
            escalation_required=False,
            rationale=f"Medium urgency indicated by phrases: {', '.join(matched_medium)}."
        )
        
    # 4. Default to Low
    return PriorityAssessment(
        severity=SeverityLevel.LOW,
        priority_score=10,
        safety_flags=[],
        escalation_required=False,
        rationale="No elevated urgency indicators found. Standard observation."
    )
