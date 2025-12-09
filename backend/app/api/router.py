from fastapi import APIRouter
from app.api.endpoints import ocr, ai, chat, medicine, speech, push

api_router = APIRouter()

api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Analysis"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(medicine.router, prefix="/medicines", tags=["Medicines"])
api_router.include_router(speech.router, tags=["Speech"])
api_router.include_router(push.router, prefix="/push", tags=["Push Notifications"])
