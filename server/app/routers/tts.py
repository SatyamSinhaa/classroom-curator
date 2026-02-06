from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from services.tts_service import generate_speech
import traceback

router = APIRouter(
    prefix="/api/tts", # Prefix with /api to match other routes if they are prefixed, but main.py didn't seem to force /api globally. Wait, let's check main.py again. Browsing main.py... it just includes routers.
    tags=["Text to Speech"]
)

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"

@router.post("/generate")
async def generate_tts(request: TTSRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text is required")
            
        audio_data = await generate_speech(request.text, request.voice, request.rate, request.pitch)
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
