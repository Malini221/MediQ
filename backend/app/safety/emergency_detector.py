"""Deterministic safety checks used independently from the local AI model."""

from typing import Any

CRITICAL_KEYWORDS = (
    "unresponsive", "stopped breathing", "no pulse", "severe bleeding",
    "choking", "heart attack", "stroke", "seizure", "suicide", "self harm",
)

HIGH_KEYWORDS = (
    "chest pain", "difficulty breathing", "severe pain", "fainted",
    "high fever", "allergic reaction", "heavy bleeding", "confused",
)


def detect_safety(text: str) -> dict[str, Any]:
    normalized = (text or "").lower()
    critical = [term for term in CRITICAL_KEYWORDS if term in normalized]
    high = [term for term in HIGH_KEYWORDS if term in normalized]

    if critical:
        return {
            "severity": "critical",
            "priority_score": 100,
            "safety_flags": critical,
            "escalation_required": True,
        }
    if high:
        return {
            "severity": "high",
            "priority_score": 75,
            "safety_flags": high,
            "escalation_required": False,
        }
    return {
        "severity": "low",
        "priority_score": 10,
        "safety_flags": [],
        "escalation_required": False,
    }
