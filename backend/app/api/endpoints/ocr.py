from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.medicine import OCRAnalyzeResponse, DrugInteraction
from app.services.gemini_service import gemini_service

router = APIRouter()


@router.post("/analyze", response_model=OCRAnalyzeResponse)
async def analyze_prescription(image: UploadFile = File(...)):
    """
    처방전 이미지를 분석하여 약물 정보를 추출합니다.
    """
    # 이미지 파일 검증
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    # 파일 크기 제한 (10MB)
    max_size = 10 * 1024 * 1024
    content = await image.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="파일 크기가 10MB를 초과합니다.")

    # Gemini Vision으로 이미지 분석
    result = await gemini_service.analyze_prescription_image(content)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "이미지 분석에 실패했습니다.")
        )

    # 약물 간 상호작용 체크
    medicine_names = [med.name for med in result["medicines"]]
    interactions = await gemini_service.check_drug_interactions(
        new_medicines=medicine_names,
        existing_medicines=[]  # TODO: 기존 약물 정보 조회
    )

    # 상호작용 경고를 약물에 추가
    for interaction in interactions:
        for med in result["medicines"]:
            if med.name in [interaction.drug1, interaction.drug2]:
                med.warning = interaction.description

    return OCRAnalyzeResponse(
        success=True,
        medicines=result["medicines"],
        warnings=interactions,
        raw_text=result.get("raw_text")
    )
