from typing import Optional
from sqlmodel import SQLModel, Field

class Teacher(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str

class LoginRequest(SQLModel):
    username: str
    password: str

class LoginResponse(SQLModel):
    token: str
    username: str
