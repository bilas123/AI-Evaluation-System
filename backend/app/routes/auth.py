from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select
from app.db import engine
from app.models import Teacher, LoginRequest, LoginResponse
from app.services.auth_service import verify_password, create_access_token, get_current_teacher

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    with Session(engine) as session:
        statement = select(Teacher).where(Teacher.username == request.username)
        teacher = session.exec(statement).first()
        if not teacher or not verify_password(request.password, teacher.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        token = create_access_token(teacher.username)
        return LoginResponse(token=token, username=teacher.username)

@router.get("/me")
def get_me(current_user: str = Depends(get_current_teacher)):
    return {"username": current_user}
