from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.medicine import (
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse
)
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[MedicineResponse])
async def get_medicines(user_id: str):
    """
    사용자의 모든 약물 목록을 조회합니다.
    """
    supabase = get_supabase()

    response = supabase.table("medicines").select("*").eq(
        "user_id", user_id
    ).order("created_at", desc=True).execute()

    return response.data


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(medicine_id: str):
    """
    특정 약물 정보를 조회합니다.
    """
    supabase = get_supabase()

    response = supabase.table("medicines").select("*").eq(
        "id", medicine_id
    ).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="약물을 찾을 수 없습니다.")

    return response.data


@router.post("/", response_model=MedicineResponse)
async def create_medicine(medicine: MedicineCreate):
    """
    새로운 약물을 등록합니다.
    """
    supabase = get_supabase()

    response = supabase.table("medicines").insert(
        medicine.model_dump()
    ).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="약물 등록에 실패했습니다.")

    return response.data[0]


@router.put("/{medicine_id}", response_model=MedicineResponse)
async def update_medicine(medicine_id: str, medicine: MedicineUpdate):
    """
    약물 정보를 수정합니다.
    """
    supabase = get_supabase()

    # 업데이트할 필드만 추출 (None이 아닌 값)
    update_data = {k: v for k, v in medicine.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 내용이 없습니다.")

    response = supabase.table("medicines").update(
        update_data
    ).eq("id", medicine_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="약물을 찾을 수 없습니다.")

    return response.data[0]


@router.delete("/{medicine_id}")
async def delete_medicine(medicine_id: str):
    """
    약물을 삭제합니다.
    """
    supabase = get_supabase()

    response = supabase.table("medicines").delete().eq(
        "id", medicine_id
    ).execute()

    return {"success": True, "message": "약물이 삭제되었습니다."}


@router.post("/bulk", response_model=List[MedicineResponse])
async def create_medicines_bulk(medicines: List[MedicineCreate]):
    """
    여러 약물을 한 번에 등록합니다.
    """
    supabase = get_supabase()

    medicines_data = [med.model_dump() for med in medicines]

    response = supabase.table("medicines").insert(
        medicines_data
    ).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="약물 등록에 실패했습니다.")

    return response.data
