from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import base64

from app.services.speech_service import speech_service

router = APIRouter(prefix="/speech", tags=["speech"])


class SpeechToTextRequest(BaseModel):
    audio: str  # Base64 encoded audio data
    mime_type: str = "audio/webm"


class SpeechToTextResponse(BaseModel):
    success: bool
    text: str
    confidence: float = 0.0
    error: Optional[str] = None


class TextToSpeechRequest(BaseModel):
    text: str
    language: str = "ko-KR"


class TextToSpeechResponse(BaseModel):
    success: bool
    use_browser_tts: bool = False
    text: str
    language: str
    audio: Optional[str] = None  # Base64 encoded audio (if server-side TTS)
    mime_type: Optional[str] = None
    message: Optional[str] = None


@router.post("/stt", response_model=SpeechToTextResponse)
async def speech_to_text(request: SpeechToTextRequest):
    """
    음성을 텍스트로 변환합니다 (Speech-to-Text)
    """
    try:
        # Base64 디코딩
        audio_data = base64.b64decode(request.audio)

        result = await speech_service.speech_to_text(
            audio_data=audio_data,
            mime_type=request.mime_type
        )

        return SpeechToTextResponse(
            success=result.get("success", False),
            text=result.get("text", ""),
            confidence=result.get("confidence", 0.0),
            error=result.get("error")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts", response_model=TextToSpeechResponse)
async def text_to_speech(request: TextToSpeechRequest):
    """
    텍스트를 음성으로 변환합니다 (Text-to-Speech)

    현재는 브라우저의 Web Speech API 사용을 권장합니다.
    """
    try:
        result = await speech_service.text_to_speech(
            text=request.text,
            language=request.language
        )

        return TextToSpeechResponse(
            success=result.get("success", False),
            use_browser_tts=result.get("use_browser_tts", False),
            text=result.get("text", ""),
            language=result.get("language", "ko-KR"),
            audio=result.get("audio"),
            mime_type=result.get("mime_type"),
            message=result.get("message")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
