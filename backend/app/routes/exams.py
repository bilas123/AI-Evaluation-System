from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select
from app.db import engine
from app.models import (
    Exam, Question, ExamCreate, ExamRead, ExamListItem, QuestionRead
)
from app.services.auth_service import get_current_teacher

router = APIRouter(prefix="/api/exams", tags=["exams"])

@router.post("", response_model=ExamRead, status_code=status.HTTP_201_CREATED)
def create_exam(body: ExamCreate, current_user: str = Depends(get_current_teacher)):
    if not body.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An exam must have at least one question"
        )
    with Session(engine) as session:
        exam = Exam(title=body.title, subject=body.subject)
        session.add(exam)
        session.commit()
        session.refresh(exam)

        questions = []
        for i, q in enumerate(body.questions, start=1):
            question = Question(
                exam_id=exam.id,
                question_number=i,
                question_text=q.question_text,
                max_marks=q.max_marks,
                reference_answer=q.reference_answer,
                marking_criteria=q.marking_criteria,
            )
            session.add(question)
            questions.append(question)

        session.commit()
        for q in questions:
            session.refresh(q)

        question_reads = [
            QuestionRead(
                id=q.id,
                exam_id=q.exam_id,
                question_number=q.question_number,
                question_text=q.question_text,
                max_marks=q.max_marks,
                reference_answer=q.reference_answer,
                marking_criteria=q.marking_criteria,
            )
            for q in questions
        ]
        return ExamRead(
            id=exam.id,
            title=exam.title,
            subject=exam.subject,
            created_at=exam.created_at,
            questions=question_reads,
        )

@router.get("", response_model=list[ExamListItem])
def list_exams(current_user: str = Depends(get_current_teacher)):
    with Session(engine) as session:
        exams = session.exec(select(Exam).order_by(Exam.created_at.desc())).all()
        result = []
        for exam in exams:
            q_count = len(session.exec(
                select(Question).where(Question.exam_id == exam.id)
            ).all())
            result.append(ExamListItem(
                id=exam.id,
                title=exam.title,
                subject=exam.subject,
                created_at=exam.created_at,
                question_count=q_count,
            ))
        return result

@router.get("/{exam_id}", response_model=ExamRead)
def get_exam(exam_id: int, current_user: str = Depends(get_current_teacher)):
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam not found"
            )
        questions = session.exec(
            select(Question)
            .where(Question.exam_id == exam_id)
            .order_by(Question.question_number)
        ).all()
        question_reads = [
            QuestionRead(
                id=q.id,
                exam_id=q.exam_id,
                question_number=q.question_number,
                question_text=q.question_text,
                max_marks=q.max_marks,
                reference_answer=q.reference_answer,
                marking_criteria=q.marking_criteria,
            )
            for q in questions
        ]
        return ExamRead(
            id=exam.id,
            title=exam.title,
            subject=exam.subject,
            created_at=exam.created_at,
            questions=question_reads,
        )
