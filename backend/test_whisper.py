import asyncio
from app.ai.speech_to_text import transcribe_audio, get_whisper_model

def run_test():
    try:
        # Load the model to verify it downloads and initializes
        print("Loading model...")
        model = get_whisper_model()
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")

if __name__ == "__main__":
    run_test()
