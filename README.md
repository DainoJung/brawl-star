# 💊 복약 도우미 - OCR 기반 올인원 복약 관리 AI 에이전트

> "찍으면, 분석하고, 챙겨준다."

약 봉투나 처방전을 사진으로 찍기만 하면, AI가 약을 인식하고 안전성을 분석하여 최적의 복약 스케줄을 자동으로 관리해주는 헬스케어 웹앱 서비스입니다.

## 🛠 기술 스택

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Model**: Google Gemini 1.5 Flash (Multimodal)

## 📁 프로젝트 구조

```
brawl-star/
├── frontend/           # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/       # App Router 페이지
│   │   ├── components/ # 재사용 컴포넌트
│   │   ├── lib/       # 유틸리티 (API, Supabase)
│   │   ├── store/     # Zustand 상태관리
│   │   └── types/     # TypeScript 타입
│   └── package.json
├── backend/            # FastAPI 백엔드
│   ├── app/
│   │   ├── api/       # API 엔드포인트
│   │   ├── core/      # 설정, DB 연결
│   │   ├── services/  # 비즈니스 로직 (Gemini)
│   │   └── schemas/   # Pydantic 스키마
│   └── requirements.txt
├── supabase/           # Supabase 스키마
│   └── schema.sql
└── README.md
```

## 🚀 시작하기

### 1. 사전 요구사항

- Node.js 18+
- Python 3.11+
- Supabase 계정
- Google AI Studio API 키

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/schema.sql` 내용을 SQL Editor에서 실행
3. Project Settings > API에서 URL과 키 복사

### 3. 환경변수 설정

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# .env 파일 수정
```

**Frontend (.env.local)**
```bash
cd frontend
cp .env.local.example .env.local
# .env.local 파일 수정
```

### 4. Backend 실행

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 문서: http://localhost:8000/docs

### 5. Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

앱: http://localhost:3000

## 📱 주요 기능

### A. OCR 기반 약 등록
- 처방전 촬영 → Gemini Vision으로 텍스트 추출
- 약 이름, 용량, 복용 횟수 자동 인식
- 인식 신뢰도 표시 및 수정 기능

### B. AI 안전성 분석
- 신규 약과 기존 약 간 상호작용 분석
- 병용 금기 약물 경고 (Red Card)
- 복용 주의사항 안내

### C. 스마트 스케줄링
- 식전/식후, 복용 횟수 기반 자동 시간 배정
- 드래그 앤 드롭으로 시간 수정
- 시간대별 복용 약 요약

### D. 대시보드 및 알림
- 오늘의 복약 현황 표시
- 복용 완료/예정/놓침 상태 관리
- PWA Push Notification (예정)

### E. AI 복약 도우미 챗봇
- 약물 관련 질문 실시간 답변
- 내 약 정보 기반 맞춤 응답 (RAG)
- 음성 입력 지원 (STT)

## 📡 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ocr/analyze` | 처방전 이미지 분석 |
| POST | `/api/ai/check-interactions` | 약물 상호작용 체크 |
| POST | `/api/ai/generate-schedule` | 복용 스케줄 생성 |
| POST | `/api/chat/message` | 챗봇 메시지 전송 |
| GET | `/api/medicines` | 약물 목록 조회 |
| POST | `/api/medicines` | 약물 등록 |
| PUT | `/api/medicines/{id}` | 약물 수정 |
| DELETE | `/api/medicines/{id}` | 약물 삭제 |

## 🔐 환경변수

### Backend
| 변수명 | 설명 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `SUPABASE_SERVICE_KEY` | Supabase 서비스 키 |
| `GOOGLE_API_KEY` | Google AI Studio API 키 |

### Frontend
| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## 📝 개발 로드맵

- [x] Phase 1: MVP (핵심 기능 구현)
  - [x] Next.js + Supabase 기본 세팅
  - [x] Gemini 연동 (Image to JSON)
  - [x] 약 봉투 촬영 및 리스트 저장
  - [x] 홈 대시보드 UI

- [ ] Phase 2: AI 고도화
  - [ ] 병용 금기 데이터 로직 강화
  - [ ] 복용 스케줄 최적화
  - [ ] 상호작용 경고 UI 개선

- [ ] Phase 3: 사용자 경험 강화
  - [ ] PWA Push Notification
  - [ ] RAG 기반 챗봇 고도화
  - [ ] 음성 인식 기능 추가

## 📄 라이선스

MIT License
