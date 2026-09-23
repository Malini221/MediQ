import logging
from typing import List

logger = logging.getLogger(__name__)
_model = None

class EmbeddingProvider:
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError

class SentenceTransformersProvider(EmbeddingProvider):
    def __init__(self):
        global _model
        if _model is None:
            try:
                from sentence_transformers import SentenceTransformer
                # all-MiniLM-L6-v2 produces exactly 384 dimensions
                logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2' (384 dimensions)...")
                _model = SentenceTransformer("all-MiniLM-L6-v2")
            except ImportError:
                logger.error("sentence-transformers library not installed.")
                raise
        self.model = _model
        
    def embed_text(self, text: str) -> List[float]:
        if not text:
            text = " "
        embedding = self.model.encode(text)
        return embedding.tolist()

def get_embedding_provider() -> EmbeddingProvider:
    return SentenceTransformersProvider()
