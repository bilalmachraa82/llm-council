
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client if key is present
# We use this for Whisper (STT) and TTS
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None

if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper API.
    """
    if not openai_client:
        raise ValueError("OPENAI_API_KEY not configured. Cannot perform speech-to-text.")
    
    with open(file_path, "rb") as audio_file:
        transcription = await openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
    return transcription


async def synthesize_speech(text: str, output_path: str):
    """
    Convert text to speech using OpenAI TTS API.
    """
    if not openai_client:
        raise ValueError("OPENAI_API_KEY not configured. Cannot perform text-to-speech.")
        
    response = await openai_client.audio.speech.create(
        model="tts-1-hd", # High quality
        voice="onyx",     # Deep, authoritative "Chairman" voice
        input=text
    )
    
    response.stream_to_file(output_path)
