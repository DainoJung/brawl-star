# iOS PWA 백그라운드 Push 알림 설정 가이드

## 개요

이 가이드는 iOS PWA에서 앱을 닫아도 알림을 받을 수 있도록 Web Push 알림을 설정하는 방법을 설명합니다.

## 요구 사항

### iOS 사용자
- **iOS 16.4 이상** 필수
- Safari에서 **"홈 화면에 추가"**로 PWA 설치 필수
- 알림 권한 허용 필수

### 서버
- Python 3.9+
- FastAPI 백엔드 실행 중
- Supabase 데이터베이스

## 설정 단계

### 1. VAPID 키 생성

백엔드 디렉토리에서 VAPID 키를 생성합니다:

```bash
cd backend

# pywebpush 설치 (requirements.txt에 포함됨)
pip install pywebpush

# VAPID 키 생성
python -c "from py_vapid import Vapid; v = Vapid(); v.generate_keys(); print(f'VAPID_PUBLIC_KEY={v.public_key}'); print(f'VAPID_PRIVATE_KEY={v.private_key}')"
```

또는 스크립트 사용:

```bash
python scripts/generate_vapid_keys.py
```

### 2. 환경 변수 설정

백엔드 `.env` 파일에 VAPID 키 추가:

```env
# Web Push (VAPID)
VAPID_PUBLIC_KEY=생성된_공개키
VAPID_PRIVATE_KEY=생성된_비공개키
VAPID_CLAIMS_EMAIL=mailto:your-email@example.com
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 다음 마이그레이션 실행:

```sql
-- supabase/migrations/003_push_subscriptions.sql 파일 내용 실행
```

또는 Supabase CLI 사용:

```bash
supabase db push
```

### 4. 백엔드 서버 시작

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

서버가 시작되면 알람 스케줄러가 자동으로 실행됩니다.

### 5. 프론트엔드 빌드

```bash
cd frontend
npm run build
npm start
```

## 사용 방법

### iOS에서 PWA 설치

1. Safari에서 앱 열기
2. 공유 버튼 탭 → "홈 화면에 추가" 선택
3. 추가된 앱 아이콘으로 앱 열기

### 백그라운드 알림 활성화

1. 알람 페이지로 이동
2. "백그라운드 알림" 섹션에서 "활성화" 버튼 탭
3. 알림 권한 요청 승인
4. "테스트 알림 보내기"로 동작 확인

## API 엔드포인트

### Push 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/push/vapid-public-key` | VAPID 공개키 조회 |
| POST | `/api/push/subscribe` | Push 구독 등록 |
| POST | `/api/push/unsubscribe` | Push 구독 해제 |
| POST | `/api/push/test` | 테스트 알림 발송 |

### 요청 예시

```bash
# 테스트 알림 발송
curl -X POST http://localhost:8000/api/push/test \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "title": "테스트 알림",
    "body": "알림이 정상적으로 작동합니다!"
  }'
```

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    알림 발송 플로우                           │
└─────────────────────────────────────────────────────────────┘

1️⃣ 사용자가 PWA에서 "백그라운드 알림 활성화" 클릭
   └─> pushManager.subscribe() 호출
   └─> 구독 정보 (endpoint, keys) 서버로 전송
   └─> push_subscriptions 테이블에 저장

2️⃣ 백엔드 AlarmScheduler가 매분 실행
   └─> 현재 시간 == 약 복용 시간?
   └─> 해당 사용자의 push_subscriptions 조회
   └─> pywebpush로 Push 메시지 발송

3️⃣ Service Worker가 Push 이벤트 수신
   └─> self.addEventListener('push', ...)
   └─> showNotification() 호출
   └─> 앱이 닫혀있어도 알림 표시!

4️⃣ 사용자가 알림 클릭
   └─> notificationclick 이벤트
   └─> 앱 열기 또는 포커스
```

## 문제 해결

### 알림이 오지 않는 경우

1. **iOS 버전 확인**: iOS 16.4 이상인지 확인
2. **PWA 설치 확인**: 반드시 "홈 화면에 추가"로 설치해야 함
3. **알림 권한 확인**: 설정 → 알림에서 앱 알림 허용 확인
4. **VAPID 키 확인**: 공개키/비공개키가 올바르게 설정되었는지 확인

### 콘솔 로그 확인

```javascript
// Safari 개발자 도구에서 확인
// Service Worker 콘솔: [SW] Push 수신
// 앱 콘솔: [Push] 구독 성공
```

### 구독 만료

Push 구독은 브라우저에서 자동으로 갱신됩니다. 410 Gone 응답을 받으면 서버에서 자동으로 해당 구독을 삭제합니다.

## 제한 사항

### iOS PWA 제한

- **무음 Push 불가**: 반드시 사용자에게 알림을 표시해야 함 (userVisibleOnly: true)
- **배터리 최적화**: iOS가 백그라운드 앱을 종료하면 알림이 지연될 수 있음
- **Safari 전용**: iOS에서는 Safari만 PWA Push 지원

### 알림 액션 버튼

iOS PWA에서 알림 액션 버튼(복용 완료, 5분 후 알림)은 지원되지 않을 수 있습니다. 알림 클릭 시 앱이 열리는 방식으로 동작합니다.

## 참고 자료

- [Web Push Protocol](https://web.dev/push-notifications-web-push-protocol/)
- [iOS PWA Push Notifications](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [pywebpush Documentation](https://github.com/web-push-libs/pywebpush)
