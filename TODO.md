# 프로젝트 구현 현황

## 📋 미구현 및 Mock 데이터 현황

---

### 🔴 높은 우선순위 (핵심 기능)

| 파일 | 문제 | 상세 |
|------|------|------|
| `prescription-processing/page.tsx` | 완전 시뮬레이션 | setTimeout으로 단계별 진행만 표시, 실제 OCR API 호출 없음 |
| `prescription-result/page.tsx` | Mock 결과 데이터 | 4개 약 인식 결과가 하드코딩됨 |
| `medicine/search/page.tsx` | Mock 약물 DB | 12개 약물 데이터베이스 하드코딩 + localStorage 저장 |
| `chatbot/page.tsx` | 시뮬레이션 응답 | AI 응답이 하드코딩된 4개 질문/답변, 음성인식도 시뮬레이션 |

---

### 🟡 중간 우선순위

| 파일 | 문제 | 상세 |
|------|------|------|
| `medicine/page.tsx` | Mock 약 목록 | 3개 약 데이터 하드코딩 (혈압약, 당뇨약, 소화제) |
| `prescription-schedule/page.tsx` | Mock 스케줄 | 4개 약 스케줄 하드코딩 |
| `alarm/page.tsx` | Mock 알람 + 검증 시뮬레이션 | 3개 알람 하드코딩, 약 사진 검증이 1.5초 후 무조건 성공 |
| `alarm/[id]/page.tsx` | Mock 데이터 + console.log만 | 알람 상세정보 하드코딩, 저장/삭제가 console.log만 |

---

### 🟢 낮은 우선순위

| 파일 | 문제 | 상세 |
|------|------|------|
| `prescription-complete/page.tsx` | 하드코딩 텍스트 | "4개의 약" 숫자가 고정 |
| `prescription-capture/page.tsx` | API 폴백 | API 실패시 시뮬레이션 모드로 진행 (의도된 동작) |

---

## 📝 실제 구현 필요 항목

### 1. 백엔드 API 연동

```
POST /api/ocr/analyze        → 처방전 OCR 분석
POST /api/chat               → AI 챗봇 응답
POST /api/verify-medicine    → 약 사진 검증 (알람 해제용)
GET  /api/medicines          → 약물 데이터베이스 검색
GET  /api/medicines/:id      → 약물 상세 정보
POST /api/medicines          → 약물 등록
PUT  /api/medicines/:id      → 약물 수정
DELETE /api/medicines/:id    → 약물 삭제
GET  /api/alarms             → 알람 목록
POST /api/alarms             → 알람 등록
PUT  /api/alarms/:id         → 알람 수정
DELETE /api/alarms/:id       → 알람 삭제
```

### 2. 상태 관리 연동

```
- 약 목록: Zustand store 또는 Supabase 연동
- 알람 목록: localStorage 또는 Supabase 연동
- 처방전 인식 결과: 페이지 간 상태 전달
```

### 3. 실제 기능 구현

```
- Web Speech API: 음성 인식 (chatbot)
- AI 검증: 약 사진 검증 로직 (alarm)
- 동적 계산: 등록된 약 개수 표시 (prescription-complete)
```

---

## 🔧 console.log만 있는 핸들러

| 위치 | 함수 | 필요 작업 |
|------|------|----------|
| `alarm/[id]/page.tsx:108` | `handleSave()` | API 호출 또는 localStorage 저장 |
| `alarm/[id]/page.tsx:114` | `handleDelete()` | API 호출 또는 localStorage 삭제 |
| `medicine/search/page.tsx:244` | `handleAddMedicine()` | API 호출 (현재 localStorage만) |

---

## ✅ 구현 완료된 기능

### 프론트엔드
- [x] 홈 페이지 UI
- [x] 약 관리 페이지 (수정/삭제 모달)
- [x] 약 검색 페이지 (검색 UI, 카테고리)
- [x] 처방전 촬영 (카메라/업로드)
- [x] 처방전 처리 중 UI
- [x] 처방전 결과 확인 UI
- [x] 복용 시간 설정 UI
- [x] 등록 완료 UI
- [x] 알람 목록 페이지
- [x] 알람 상세 설정 페이지
- [x] 알람 미리보기 (사진 찍어서 끄기)
- [x] AI 챗봇 UI
- [x] 하단 네비게이션
- [x] 토글 스위치 컴포넌트

### 백엔드
- [x] FastAPI 프로젝트 구조
- [x] OCR 분석 엔드포인트 (Gemini 연동)
- [x] 약물 상호작용 체크 엔드포인트
- [x] 스케줄 생성 엔드포인트
- [x] 챗봇 엔드포인트
- [x] 약물 CRUD 엔드포인트

### 데이터베이스
- [x] Supabase 스키마 (profiles, medicines, schedules, alarms, chat_messages)
- [x] RLS 정책

---

## 📅 업데이트 이력

- **2025-12-02**: 초기 문서 작성, 미구현 현황 정리
