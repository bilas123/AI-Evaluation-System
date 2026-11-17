from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select
from app.db import engine
from app.models import (
    Exam, Question, ExamCreate, ExamRead, ExamListItem, QuestionRead,
    Submission, Answer
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

@router.get("/{exam_id}/results")
def get_exam_results(exam_id: int, current_user: str = Depends(get_current_teacher)):
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam not found"
            )
        questions = session.exec(
            select(Question).where(Question.exam_id == exam_id).order_by(Question.question_number)
        ).all()
        max_total = sum(q.max_marks for q in questions)
        q_map = {q.id: q for q in questions}

        submissions = session.exec(
            select(Submission).where(Submission.exam_id == exam_id).order_by(Submission.student_label)
        ).all()

        results = []
        for sub in submissions:
            answers = session.exec(
                select(Answer).where(Answer.submission_id == sub.id)
            ).all()

            sub_answers = []
            total_ai = 0.0
            total_final = 0.0
            has_evaluated = False

            for a in answers:
                q = q_map.get(a.question_id)
                if not q:
                    continue
                ai_m = a.ai_marks if a.ai_marks is not None else None
                fin_m = a.final_marks if a.final_marks is not None else None
                if a.evaluation_status in ["evaluated", "finalized"]:
                    has_evaluated = True
                    if ai_m is not None:
                        total_ai += ai_m
                    if fin_m is not None:
                        total_final += fin_m

                sub_answers.append({
                    "answer_id": a.id,
                    "question_id": q.id,
                    "question_number": q.question_number,
                    "max_marks": q.max_marks,
                    "verification_status": a.verification_status,
                    "evaluation_status": a.evaluation_status,
                    "ai_marks": ai_m,
                    "teacher_marks": a.teacher_marks,
                    "final_marks": fin_m,
                })

            sub_answers.sort(key=lambda x: x["question_number"])
            results.append({
                "submission_id": sub.id,
                "student_label": sub.student_label,
                "status": sub.status,
                "total_max_marks": max_total,
                "total_ai_marks": round(total_ai, 2) if has_evaluated else None,
                "total_final_marks": round(total_final, 2) if has_evaluated else None,
                "answers": sub_answers,
            })

        return {
            "exam_id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "total_max_marks": max_total,
            "submissions": results,
        }
