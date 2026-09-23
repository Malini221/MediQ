from pydantic import BaseModel, Field
from typing import List, Optional

class ObservationExtractionResult(BaseModel):
    category: Optional[str] = Field(None, description="General category of the observation")
    symptoms: List[str] = Field(default_factory=list, description="List of observed symptoms")
    relevant_clinical_details: List[str] = Field(default_factory=list, description="Other clinical details observed")
    concern_indicators: List[str] = Field(default_factory=list, description="Indicators of concern or severity supported by text")
    sentiment_indicators: Optional[str] = Field(None, description="General sentiment of the observation")
    extracted_entities: List[str] = Field(default_factory=list, description="Any other relevant extracted entities")
