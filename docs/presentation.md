# 💊 복약 도우미

## OCR 기반 올인원 복약 관리 AI 에이전트

> "찍으면, 분석하고, 챙겨준다."

---

## n8n workflow

### OCR

```
📷 이미지 촬영
     ↓
🤖 Gemini Vision API
     ↓
📋 약물 정보 추출 (JSON)
     ↓
⚠️ 약물 상호작용 분석
     ↓
💾 Supabase 저장
```

**처리 과정:**
1. 사용자가 처방전/약 봉투 촬영
2. Base64 인코딩 후 FastAPI 서버로 전송
3. Gemini 2.5 Flash로 이미지 분석
4. 약 이름, 용량, 복용 횟수, 복용 시기 자동 추출
5. 인식 신뢰도(confidence) 점수 제공
6. 병용 금기 약물 자동 경고

---

### Chatbot

```
👤 사용자 질문
     ↓
🎤 STT (음성 → 텍스트) [선택]
     ↓
🤖 Gemini AI (맥락 기반 응답)
     ↓
📢 TTS (텍스트 → 음성) [선택]
     ↓
💬 응답 표시
```

**주요 기능:**
- RAG 기반 맞춤 응답 (사용자 복용 약 정보 활용)
- 실시간 음성 입력 (STT)
- AI 응답 음성 출력 (TTS)
- 자주 묻는 질문 빠른 선택

---

## Prototype

### Stack

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | Supabase (PostgreSQL) |
| **AI API** | Gemini 2.5 Flash Preview (Multimodal) |
| **State Management** | Zustand |
| **Hosting** | Vercel (Frontend), Render (Backend) |

**주요 라이브러리:**
- `google-generativeai` - Gemini API
- `@supabase/supabase-js` - DB 연동
- `Pillow` - 이미지 처리
- `pywebpush` - PWA 푸시 알림
- `apscheduler` - 알람 스케줄링

---

### Features

#### A. OCR 기반 약 등록
- 📷 처방전 촬영 → AI 자동 인식
- ✅ 약 이름, 용량, 복용 횟수 추출
- 🎯 인식 신뢰도 표시 (85%↑ 자동, 60%↑ 확인, 60%↓ 검토)

#### B. AI 안전성 분석
- ⚠️ 약물 상호작용 자동 체크
- 🔴 병용 금기 경고 (High/Medium/Low)
- 📋 복용 주의사항 안내

#### C. 스마트 스케줄링
- ⏰ 식전/식후 기반 자동 시간 배정
- 📅 1일 1회/2회/3회 복용 일정 생성
- 🗓️ 요일별 반복 설정

#### D. 대시보드 & 알림
- 📊 오늘의 복약 현황 (완료/예정)
- 🔔 PWA Push Notification (백그라운드 지원)
- 📸 사진 촬영으로 복용 확인 (알람 종료)

#### E. AI 복약 도우미 챗봇
- 💬 약물 관련 질문 실시간 답변
- 🎤 음성 입력 지원 (STT)
- 🔊 음성 출력 지원 (TTS)
- 📝 후속 질문 추천

---

### 시스템 아키텍처

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Next.js   │───▶│   FastAPI   │───▶│   Gemini    │
│  (Vercel)   │◀───│  (Render)   │◀───│  Flash AI   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────────────┐
│         Supabase (PostgreSQL)        │
│  - medicines (약 정보)                │
│  - medicine_logs (복용 기록)          │
│  - push_subscriptions (알림 구독)     │
└─────────────────────────────────────┘
```

---

### API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/ocr/analyze` | 처방전 이미지 분석 |
| `POST` | `/api/ai/check-interactions` | 약물 상호작용 체크 |
| `POST` | `/api/ai/generate-schedule` | 복용 스케줄 생성 |
| `POST` | `/api/chat/message` | 챗봇 메시지 전송 |
| `POST` | `/api/speech/stt` | 음성 → 텍스트 |
| `POST` | `/api/speech/tts` | 텍스트 → 음성 |
| `GET/POST` | `/api/medicines` | 약물 CRUD |

---

## 감사합니다! 🙏
