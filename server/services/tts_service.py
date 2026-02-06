import edge_tts
import io

async def generate_speech(text: str, voice: str = "en-US-AriaNeural", rate: str = "+0%", pitch: str = "+0Hz") -> bytes:
    """
    Generate speech audio from text using Microsoft Edge's online TTS service.
    
    Args:
        text: The text to convert to speech.
        voice: The voice to use (default: en-US-AriaNeural).
        rate: The speaking rate (e.g., "+0%", "-10%", "+50%").
        pitch: The speaking pitch (e.g., "+0Hz", "+5Hz").
               
    Returns:
        bytes: The audio data in MP3 format.
    """
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    audio_stream = io.BytesIO()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
            
    return audio_stream.getvalue()
