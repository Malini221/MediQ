import logging
from typing import Dict, Any
from app.schemas.extraction import ObservationExtractionResult

logger = logging.getLogger(__name__)

# Lazy instantiate the local classifier
_classifier = None

def get_extraction_model():
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            # Use local/free-first implementation.
            # Using zero-shot classification to demonstrate basic local extraction.
            logger.info("Loading Hugging Face extraction model...")
            _classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        except ImportError:
            logger.error("transformers library is not installed.")
            raise
    return _classifier

def extract_metadata(text: str) -> Dict[str, Any]:
    """
    Extracts structured metadata from the raw text using local Hugging Face ecosystem.
    Returns a dictionary conforming to ObservationExtractionResult.
    """
    if not text or not text.strip():
        return ObservationExtractionResult().model_dump()
        
    try:
        classifier = get_extraction_model()
        
        # Determine category
        categories = ["routine observation", "symptom report", "behavioral issue", "urgent concern"]
        result = classifier(text, candidate_labels=categories)
        best_category = result["labels"][0]
        
        # Determine concern
        concern_labels = ["concerning", "not concerning"]
        concern_res = classifier(text, candidate_labels=concern_labels)
        concern_indicators = []
        if concern_res["labels"][0] == "concerning" and concern_res["scores"][0] > 0.6:
            concern_indicators.append("Text indicates potential concern.")
            
        # Compile result strictly adhering to schema. 
        # (Symptom/Clinical details extraction usually needs an NER pipeline; 
        # keeping empty rather than hallucinating per requirements).
        extraction = ObservationExtractionResult(
            category=best_category,
            concern_indicators=concern_indicators,
            symptoms=[], 
            relevant_clinical_details=[],
            sentiment_indicators="neutral",
            extracted_entities=[]
        )
        return extraction.model_dump()
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}")
        # Fail safely by returning an empty valid structure
        return ObservationExtractionResult().model_dump()
