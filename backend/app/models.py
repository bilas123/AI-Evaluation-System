from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

# ── Database tables ──

class Teacher(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str

class Exam(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    subject: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exam.id")
    question_number: int
    question_text: str
    max_marks: float
    reference_answer: str
    marking_criteria: str

# ── Request / response schemas (not database tables) ──

class LoginRequest(SQLModel):
    username: str
    password: str

class LoginResponse(SQLModel):
    token: str
    username: str

class QuestionCreate(SQLModel):
    question_text: str
    max_marks: float
    reference_answer: str
    marking_criteria: str

class ExamCreate(SQLModel):
    title: str
    subject: str
    questions: list[QuestionCreate]

class QuestionRead(SQLModel):
    id: int
    exam_id: int
    question_number: int
    question_text: str
    max_marks: float
    reference_answer: str
    marking_criteria: str

class ExamRead(SQLModel):
    id: int
    title: str
    subject: str
    created_at: datetime
    questions: list[QuestionRead] = []

class ExamListItem(SQLModel):
    id: int
    title: str
    subject: str
    created_at: datetime
    question_count: int
