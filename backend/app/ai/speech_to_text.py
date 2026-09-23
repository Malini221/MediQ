import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazily instantiated model to avoid blocking fastAPI startup and to conserve memory
_model = None

def get_whisper_model():
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
            # Using 'tiny' or 'base' for local-first fast processing
            # CPU is default for maximum compatibility, int8 for speed
            logger.info("Loading Faster-Whisper model...")
            _model = WhisperModel("tiny", device="cpu", compute_type="int8")
        except ImportError:
            logger.error("faster-whisper is not installed.")
            raise
    return _model

def transcribe_audio(file_path: str, language: Optional[str] = None) -> Optional[str]:
    """
    Transcribes the audio file using a local instance of faster-whisper.
    No external API calls are made.
    """
    try:
        model = get_whisper_model()
        # beam_size=5 is standard for good accuracy vs speed tradeoff
        kwargs = {"beam_size": 5}
        if language in {"en", "hi", "ta", "te"}:
            kwargs["language"] = language
        segments, info = model.transcribe(file_path, **kwargs)
        text = "".join([segment.text for segment in segments])
        return text.strip()
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise e
