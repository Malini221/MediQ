import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify():
    logger.info("Verifying sentence-transformers embedding dimension...")
    try:
        from sentence_transformers import SentenceTransformer
        # all-MiniLM-L6-v2 produces exactly 384 dimensions
        model = SentenceTransformer("all-MiniLM-L6-v2")
        embedding = model.encode("Test text")
        dim = len(embedding)
        if dim == 384:
            logger.info(f"Verification PASS: Model produced exactly {dim} dimensions.")
            sys.exit(0)
        else:
            logger.error(f"Verification FAIL: Expected 384, got {dim}.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Verification FAIL: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    verify()
