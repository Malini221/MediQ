import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def calculate_strain_signal(observations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates a caregiver support/strain signal using deterministic rules.
    Does NOT diagnose any medical or mental health condition.
    
    Scoring Factors (Max 100):
    - Base score is 0.
    - Each observation recorded adds 5 points (workload).
    - If priority_score > 75, add 10 points (stressful events).
    - If sentiment_indicators/concern indicators are present, add 10 points.
    """
    if not observations:
        return {
            "strain_score": 0,
            "sentiment_indicators": {"flags": []},
            "usage_frequency_metrics": {"recent_observations_count": 0, "high_priority_events": 0},
            "intervention_offered": None
        }

    strain_score = 0
    total_obs = len(observations)
    high_priority_count = 0
    sentiment_flags_found = []
    
    for obs in observations:
        # 1. Workload factor
        strain_score += 5
        
        # 2. Priority/Stress factor
        p_score = obs.get("priority_score", 0)
        if p_score >= 75:
            strain_score += 10
            high_priority_count += 1
            
        # 3. Sentiment/Concern factor
        metadata = obs.get("extracted_metadata") or {}
        concerns = metadata.get("concern_indicators", [])
        if concerns:
            strain_score += 10
            sentiment_flags_found.extend(concerns)

    # Bound the score deterministically
    strain_score = min(max(strain_score, 0), 100)
    
    # 4. Intervention Support Message (Not medical treatment)
    intervention_offered = None
    if strain_score >= 80:
        intervention_offered = "You have had a very high workload and stressful events recently. Consider taking a short break or discussing workload with your supervisor."
    elif strain_score >= 50:
        intervention_offered = "Your workload indicates moderate strain. Please ensure you are taking regular breaks."

    return {
        "strain_score": strain_score,
        "sentiment_indicators": {"flags": list(set(sentiment_flags_found))},
        "usage_frequency_metrics": {
            "recent_observations_count": total_obs,
            "high_priority_events": high_priority_count
        },
        "intervention_offered": intervention_offered
    }
