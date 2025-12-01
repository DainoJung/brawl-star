from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    STTTranscribeResponse
)
from app.services.gemini_service import gemini_service

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest):
    """
    사용자 메시지에 대한 AI 응답을 생성합니다.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="메시지가 비어있습니다.")

    result = await gemini_service.chat_response(
        message=request.message,
        context=request.context
    )

    return ChatMessageResponse(
        success=result["success"],
        message=result["message"],
        suggestions=result.get("suggestions")
    )


@router.post("/stt/transcribe", response_model=STTTranscribeResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    음성 파일을 텍스트로 변환합니다.
    TODO: Google Speech-to-Text API 연동
    """
    # 파일 검증
    if not audio.content_type or "audio" not in audio.content_type:
        raise HTTPException(status_code=400, detail="오디오 파일만 업로드 가능합니다.")

    # 파일 크기 제한 (5MB)
    max_size = 5 * 1024 * 1024
    content = await audio.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="파일 크기가 5MB를 초과합니다.")

    # TODO: 실제 STT 구현
    # 현재는 시뮬레이션 응답 반환
    return STTTranscribeResponse(
        success=True,
        text="이 약은 식전인가요?"
    )
