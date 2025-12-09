from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.services.alarm_scheduler import alarm_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 이벤트"""
    # 시작 시: 알람 스케줄러 시작
    print("[App] 알람 스케줄러 시작...")
    await alarm_scheduler.start()
    yield
    # 종료 시: 알람 스케줄러 중지
    print("[App] 알람 스케줄러 중지...")
    await alarm_scheduler.stop()


app = FastAPI(
    title=settings.APP_NAME,
    description="OCR 기반 올인원 복약 관리 AI 에이전트 API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "복약 도우미 API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
