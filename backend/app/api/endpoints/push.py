"""
Web Push 알림 API
- iOS PWA에서 앱을 닫아도 알림이 오도록 서버에서 Push 발송
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from pywebpush import webpush, WebPushException
import json
from datetime import datetime

from app.core.config import settings
from app.core.supabase import get_supabase_admin

router = APIRouter()


class PushSubscription(BaseModel):
    """Push 구독 정보"""
    endpoint: str
    keys: dict  # p256dh, auth


class SubscriptionRequest(BaseModel):
    """구독 요청"""
    user_id: str
    subscription: PushSubscription


class UnsubscribeRequest(BaseModel):
    """구독 해제 요청"""
    user_id: str
    endpoint: str


class TestPushRequest(BaseModel):
    """테스트 Push 요청"""
    user_id: str
    title: Optional[str] = "💊 복약 시간입니다!"
    body: Optional[str] = "약을 복용해주세요."


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """VAPID 공개키 조회 (프론트엔드에서 구독 시 필요)"""
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(
            status_code=500,
            detail="VAPID 키가 설정되지 않았습니다. 환경변수를 확인하세요."
        )
    return {"publicKey": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe_push(request: SubscriptionRequest):
    """Push 알림 구독 등록"""
    print(f"[Push] 구독 요청 수신: user_id={request.user_id}")
    print(f"[Push] endpoint: {request.subscription.endpoint[:50]}...")
    print(f"[Push] keys: p256dh={bool(request.subscription.keys.get('p256dh'))}, auth={bool(request.subscription.keys.get('auth'))}")

    supabase = get_supabase_admin()

    try:
        # 기존 구독 확인 (같은 endpoint가 있으면 업데이트)
        existing = supabase.table("push_subscriptions").select("id").eq(
            "endpoint", request.subscription.endpoint
        ).execute()
        print(f"[Push] 기존 구독 조회 결과: {len(existing.data) if existing.data else 0}개")

        subscription_data = {
            "user_id": request.user_id,
            "endpoint": request.subscription.endpoint,
            "p256dh": request.subscription.keys.get("p256dh"),
            "auth": request.subscription.keys.get("auth"),
            "updated_at": datetime.utcnow().isoformat()
        }

        if existing.data and len(existing.data) > 0:
            # 기존 구독 업데이트
            print(f"[Push] 기존 구독 업데이트 시도...")
            result = supabase.table("push_subscriptions").update(
                subscription_data
            ).eq("endpoint", request.subscription.endpoint).execute()
            print(f"[Push] 업데이트 결과: {result.data}")
        else:
            # 새 구독 등록
            subscription_data["created_at"] = datetime.utcnow().isoformat()
            print(f"[Push] 새 구독 등록 시도: {subscription_data}")
            result = supabase.table("push_subscriptions").insert(
                subscription_data
            ).execute()
            print(f"[Push] 등록 결과: {result.data}")

        return {"success": True, "message": "Push 구독이 등록되었습니다."}

    except Exception as e:
        import traceback
        print(f"[Push] 구독 등록 오류: {e}")
        print(f"[Push] 상세 오류: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unsubscribe")
async def unsubscribe_push(request: UnsubscribeRequest):
    """Push 알림 구독 해제"""
    supabase = get_supabase_admin()

    try:
        supabase.table("push_subscriptions").delete().eq(
            "user_id", request.user_id
        ).eq("endpoint", request.endpoint).execute()

        return {"success": True, "message": "Push 구독이 해제되었습니다."}

    except Exception as e:
        print(f"[Push] 구독 해제 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def test_push(request: TestPushRequest):
    """테스트 Push 알림 발송"""
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(
            status_code=500,
            detail="VAPID 키가 설정되지 않았습니다."
        )

    supabase = get_supabase_admin()

    # 사용자의 모든 구독 조회
    subscriptions = supabase.table("push_subscriptions").select("*").eq(
        "user_id", request.user_id
    ).execute()

    if not subscriptions.data:
        raise HTTPException(
            status_code=404,
            detail="등록된 Push 구독이 없습니다."
        )

    sent_count = 0
    failed_count = 0

    for sub in subscriptions.data:
        success = await send_push_notification(
            endpoint=sub["endpoint"],
            p256dh=sub["p256dh"],
            auth=sub["auth"],
            title=request.title,
            body=request.body,
            data={"type": "test"}
        )
        if success:
            sent_count += 1
        else:
            failed_count += 1

    return {
        "success": True,
        "sent": sent_count,
        "failed": failed_count
    }


async def send_push_notification(
    endpoint: str,
    p256dh: str,
    auth: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    tag: Optional[str] = None
) -> bool:
    """
    개별 Push 알림 발송

    Returns:
        bool: 발송 성공 여부
    """
    if not settings.VAPID_PRIVATE_KEY:
        print("[Push] VAPID_PRIVATE_KEY가 설정되지 않았습니다.")
        return False

    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh,
            "auth": auth
        }
    }

    payload = {
        "title": title,
        "body": body,
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "tag": tag or f"alarm-{datetime.utcnow().timestamp()}",
        "data": data or {},
        "requireInteraction": True,
        "vibrate": [200, 100, 200, 100, 200]
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": settings.VAPID_CLAIMS_EMAIL
            }
        )
        print(f"[Push] 알림 발송 성공: {endpoint[:50]}...")
        return True

    except WebPushException as e:
        print(f"[Push] 발송 실패: {e}")

        # 410 Gone - 구독이 만료됨, DB에서 삭제
        if e.response and e.response.status_code == 410:
            print(f"[Push] 만료된 구독 삭제: {endpoint[:50]}...")
            supabase = get_supabase_admin()
            supabase.table("push_subscriptions").delete().eq(
                "endpoint", endpoint
            ).execute()

        return False
    except Exception as e:
        print(f"[Push] 발송 오류: {e}")
        return False


async def send_push_to_user(
    user_id: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    tag: Optional[str] = None
) -> dict:
    """
    특정 사용자의 모든 기기에 Push 발송

    Returns:
        dict: {"sent": int, "failed": int}
    """
    supabase = get_supabase_admin()

    subscriptions = supabase.table("push_subscriptions").select("*").eq(
        "user_id", user_id
    ).execute()

    if not subscriptions.data:
        return {"sent": 0, "failed": 0}

    sent = 0
    failed = 0

    for sub in subscriptions.data:
        success = await send_push_notification(
            endpoint=sub["endpoint"],
            p256dh=sub["p256dh"],
            auth=sub["auth"],
            title=title,
            body=body,
            data=data,
            tag=tag
        )
        if success:
            sent += 1
        else:
            failed += 1

    return {"sent": sent, "failed": failed}
