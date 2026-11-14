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

class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exam.id")
    student_label: str
    status: str = Field(default="created")  # "created" | "in_progress" | "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Answer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: int = Field(foreign_key="submission.id")
    question_id: int = Field(foreign_key="question.id")
    image_path: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_engine: Optional[str] = None  # "gemini" | "tesseract" | "manual"
    ocr_status: str = Field(default="pending")  # "pending" | "reliable" | "review_required" | "failed"
    ocr_note: Optional[str] = None
    verified_text: Optional[str] = None
    verification_status: str = Field(default="unverified")  # "unverified" | "approved" | "rejected"
    ai_marks: Optional[float] = None
    ai_feedback: Optional[str] = None
    key_points_found: Optional[str] = None  # JSON string
    missing_points: Optional[str] = None    # JSON string
    teacher_marks: Optional[float] = None
    final_marks: Optional[float] = None
    evaluation_status: str = Field(default="not_evaluated")  # "not_evaluated" | "evaluated" | "failed" | "finalized"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ── Request / response schemas ──

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

class SubmissionCreate(SQLModel):
    student_label: str

class AnswerRead(SQLModel):
    id: int
    submission_id: int
    question_id: int
    question_number: int
    question_text: str
    max_marks: float
    image_path: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_engine: Optional[str] = None
    ocr_status: str
    ocr_note: Optional[str] = None
    verified_text: Optional[str] = None
    verification_status: str
    ai_marks: Optional[float] = None
    ai_feedback: Optional[str] = None
    teacher_marks: Optional[float] = None
    final_marks: Optional[float] = None
    evaluation_status: str

class SubmissionRead(SQLModel):
    id: int
    exam_id: int
    student_label: str
    status: str
    created_at: datetime
    answers: list[AnswerRead] = []
