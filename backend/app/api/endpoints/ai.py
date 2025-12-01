from fastapi import APIRouter, HTTPException
from app.schemas.medicine import (
    DrugInteractionRequest,
    DrugInteractionResponse,
    ScheduleGenerateRequest,
    ScheduleGenerateResponse
)
from app.services.gemini_service import gemini_service

router = APIRouter()


@router.post("/check-interactions", response_model=DrugInteractionResponse)
async def check_drug_interactions(request: DrugInteractionRequest):
    """
    신규 약물과 기존 약물 간의 상호작용을 분석합니다.
    """
    if not request.new_medicines:
        raise HTTPException(status_code=400, detail="분석할 약물이 없습니다.")

    interactions = await gemini_service.check_drug_interactions(
        new_medicines=request.new_medicines,
        existing_medicines=request.existing_medicines
    )

    return DrugInteractionResponse(
        success=True,
        interactions=interactions
    )


@router.post("/generate-schedule", response_model=ScheduleGenerateResponse)
async def generate_schedule(request: ScheduleGenerateRequest):
    """
    약물 정보를 기반으로 최적의 복용 스케줄을 생성합니다.
    """
    if not request.medicines:
        raise HTTPException(status_code=400, detail="스케줄을 생성할 약물이 없습니다.")

    schedules = await gemini_service.generate_schedule(request.medicines)

    return ScheduleGenerateResponse(
        success=True,
        schedules=schedules
    )
