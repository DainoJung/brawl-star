from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MedicineBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    timing: str  # 'before_meal' | 'after_meal'
    times: list[str]
    days: list[str] = ["월", "화", "수", "목", "금", "토", "일"]


class MedicineCreate(MedicineBase):
    user_id: str
    confidence: Optional[float] = None
    original_text: Optional[str] = None
    warning: Optional[str] = None
    color: Optional[str] = None


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    times: Optional[list[str]] = None
    days: Optional[list[str]] = None


class MedicineResponse(MedicineBase):
    id: str
    user_id: str
    confidence: Optional[float] = None
    original_text: Optional[str] = None
    warning: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MedicineResult(BaseModel):
    """OCR 분석 결과 약물 정보"""
    id: str
    name: str
    dosage: str
    frequency: str
    timing: str
    confidence: float
    originalText: str
    status: str  # 'auto' | 'check' | 'review'
    warning: Optional[str] = None


class DrugInteraction(BaseModel):
    """약물 상호작용 경고"""
    drug1: str
    drug2: str
    severity: str  # 'high' | 'medium' | 'low'
    description: str


class OCRAnalyzeResponse(BaseModel):
    """OCR 분석 응답"""
    success: bool
    medicines: list[MedicineResult]
    warnings: list[DrugInteraction]
    raw_text: Optional[str] = None


class DrugInteractionRequest(BaseModel):
    new_medicines: list[str]
    existing_medicines: list[str]


class DrugInteractionResponse(BaseModel):
    success: bool
    interactions: list[DrugInteraction]


class ScheduleGenerateRequest(BaseModel):
    medicines: list[dict]  # name, frequency, timing


class ScheduleGenerateResponse(BaseModel):
    success: bool
    schedules: list[dict]  # medicine_name, times
