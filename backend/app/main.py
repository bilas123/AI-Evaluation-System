from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import app.models
from app.config import settings
from app.db import init_db, check_db_connection
from app.services.auth_service import seed_teacher_if_missing
from app.routes.auth import router as auth_router
from app.routes.exams import router as exams_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_teacher_if_missing()
    yield

app = FastAPI(
    title="AI Evaluation System API",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(exams_router)

@app.get("/api/health")
def health():
    if check_db_connection():
        return {"status": "ok", "database": "connected"}
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "error", "database": "disconnected"}
    )
