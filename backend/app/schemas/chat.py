from pydantic import BaseModel
from typing import Optional


class ChatMessageRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[dict] = None  # medicines 등 추가 컨텍스트


class ChatMessageResponse(BaseModel):
    success: bool
    message: str
    suggestions: Optional[list[str]] = None


class STTTranscribeResponse(BaseModel):
    success: bool
    text: str
