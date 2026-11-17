import json
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from app.db import engine
from app.models import (
    Exam, Question, Submission, Answer,
    SubmissionCreate, SubmissionRead, AnswerRead,
    VerifyTextRequest, OverrideMarksRequest
)
from app.services.auth_service import get_current_teacher
from app.services.image_service import process_and_save_image
from app.services.ocr_service import extract_text
from app.services.grading_service import evaluate_answer

router = APIRouter(prefix="/api", tags=["submissions"])

def _build_answer_read(answer: Answer, question: Question) -> AnswerRead:
    return AnswerRead(
        id=answer.id,
        submission_id=answer.submission_id,
        question_id=answer.question_id,
        question_number=question.question_number,
        question_text=question.question_text,
        max_marks=question.max_marks,
        image_path=answer.image_path,
        ocr_text=answer.ocr_text,
        ocr_engine=answer.ocr_engine,
        ocr_status=answer.ocr_status,
        ocr_note=answer.ocr_note,
        verified_text=answer.verified_text,
        verification_status=answer.verification_status,
        ai_marks=answer.ai_marks,
        ai_feedback=answer.ai_feedback,
        key_points_found=answer.key_points_found,
        missing_points=answer.missing_points,
        teacher_marks=answer.teacher_marks,
        final_marks=answer.final_marks,
        evaluation_status=answer.evaluation_status,
    )

def _build_submission_read(session: Session, submission: Submission) -> SubmissionRead:
    answers = session.exec(
        select(Answer).where(Answer.submission_id == submission.id)
    ).all()
    answer_reads: List[AnswerRead] = []
    for a in answers:
        q = session.get(Question, a.question_id)
        if q:
            answer_reads.append(_build_answer_read(a, q))
    answer_reads.sort(key=lambda x: x.question_number)
    return SubmissionRead(
        id=submission.id,
        exam_id=submission.exam_id,
        student_label=submission.student_label,
        status=submission.status,
        created_at=submission.created_at,
        answers=answer_reads,
    )

@router.post("/exams/{exam_id}/submissions", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission(
    exam_id: int,
    body: SubmissionCreate,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

        label = body.student_label.strip()
        if not label:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student label is required")

        submission = Submission(exam_id=exam_id, student_label=label, status="created")
        session.add(submission)
        session.commit()
        session.refresh(submission)

        # Create empty answer rows for each question
        questions = session.exec(
            select(Question).where(Question.exam_id == exam_id).order_by(Question.question_number)
        ).all()
        for q in questions:
            answer = Answer(
                submission_id=submission.id,
                question_id=q.id,
                ocr_status="pending",
                verification_status="unverified",
                evaluation_status="not_evaluated",
            )
            session.add(answer)
        session.commit()

        return _build_submission_read(session, submission)

@router.get("/exams/{exam_id}/submissions", response_model=List[SubmissionRead])
def list_submissions(
    exam_id: int,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

        submissions = session.exec(
            select(Submission).where(Submission.exam_id == exam_id).order_by(Submission.created_at.desc())
        ).all()
        return [_build_submission_read(session, s) for s in submissions]

@router.get("/submissions/{submission_id}", response_model=SubmissionRead)
def get_submission(
    submission_id: int,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        submission = session.get(Submission, submission_id)
        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        return _build_submission_read(session, submission)

@router.post("/submissions/{submission_id}/answers/{question_id}/image", response_model=AnswerRead)
def upload_answer_image(
    submission_id: int,
    question_id: int,
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        submission = session.get(Submission, submission_id)
        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

        question = session.get(Question, question_id)
        if not question or question.exam_id != submission.exam_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this exam")

        answer = session.exec(
            select(Answer).where(Answer.submission_id == submission_id, Answer.question_id == question_id)
        ).first()
        if not answer:
            answer = Answer(submission_id=submission_id, question_id=question_id)
            session.add(answer)

        # 1. Process & save image
        saved_path = process_and_save_image(file)

        # 2. Run OCR extraction
        ocr_result = extract_text(saved_path)

        # 3. Store result in database
        answer.image_path = saved_path
        answer.ocr_text = ocr_result.text
        answer.ocr_engine = ocr_result.engine
        answer.ocr_status = ocr_result.status
        answer.ocr_note = ocr_result.note
        answer.verification_status = "unverified"
        answer.verified_text = None
        answer.evaluation_status = "not_evaluated"
        answer.ai_marks = None
        answer.ai_feedback = None
        answer.key_points_found = None
        answer.missing_points = None
        answer.teacher_marks = None
        answer.final_marks = None
        answer.updated_at = datetime.now(timezone.utc)

        submission.status = "in_progress"
        session.add(answer)
        session.add(submission)
        session.commit()
        session.refresh(answer)

        return _build_answer_read(answer, question)

@router.post("/answers/{answer_id}/ocr", response_model=AnswerRead)
def rerun_ocr(
    answer_id: int,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        answer = session.get(Answer, answer_id)
        if not answer or not answer.image_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer or uploaded image not found")

        question = session.get(Question, answer.question_id)
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

        ocr_result = extract_text(answer.image_path)
        answer.ocr_text = ocr_result.text
        answer.ocr_engine = ocr_result.engine
        answer.ocr_status = ocr_result.status
        answer.ocr_note = ocr_result.note
        answer.verification_status = "unverified"
        answer.verified_text = None
        answer.evaluation_status = "not_evaluated"
        answer.ai_marks = None
        answer.ai_feedback = None
        answer.key_points_found = None
        answer.missing_points = None
        answer.teacher_marks = None
        answer.final_marks = None
        answer.updated_at = datetime.now(timezone.utc)

        session.add(answer)
        session.commit()
        session.refresh(answer)

        return _build_answer_read(answer, question)

@router.get("/answers/{answer_id}/image")
def get_answer_image(
    answer_id: int,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        answer = session.get(Answer, answer_id)
        if not answer or not answer.image_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        return FileResponse(answer.image_path, media_type="image/jpeg")

@router.put("/answers/{answer_id}/verified-text", response_model=AnswerRead)
def verify_answer_text(
    answer_id: int,
    body: VerifyTextRequest,
    current_user: str = Depends(get_current_teacher)
):
    cleaned = body.text.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verified text cannot be empty"
        )

    with Session(engine) as session:
        answer = session.get(Answer, answer_id)
        if not answer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")

        question = session.get(Question, answer.question_id)
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

        answer.verified_text = cleaned
        answer.verification_status = "approved"

        # Modifying verified text invalidates any previous evaluation per AGENTS.md
        if answer.evaluation_status in ["evaluated", "finalized"]:
            answer.evaluation_status = "not_evaluated"
            answer.ai_marks = None
            answer.ai_feedback = None
            answer.key_points_found = None
            answer.missing_points = None
            answer.teacher_marks = None
            answer.final_marks = None

        answer.updated_at = datetime.now(timezone.utc)
        session.add(answer)
        session.commit()
        session.refresh(answer)

        return _build_answer_read(answer, question)

@router.post("/answers/{answer_id}/reject", response_model=AnswerRead)
def reject_answer(
    answer_id: int,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        answer = session.get(Answer, answer_id)
        if not answer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")

        question = session.get(Question, answer.question_id)
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

        answer.verification_status = "rejected"
        answer.verified_text = None

        if answer.evaluation_status in ["evaluated", "finalized"]:
            answer.evaluation_status = "not_evaluated"
            answer.ai_marks = None
            answer.ai_feedback = None
            answer.key_points_found = None
            answer.missing_points = None
            answer.teacher_marks = None
            answer.final_marks = None

        answer.updated_at = datetime.now(timezone.utc)
        session.add(answer)
        session.commit()
        session.refresh(answer)

        return _build_answer_read(answer, question)

@router.post("/answers/{answer_id}/evaluate", response_model=AnswerRead)
def evaluate_answer_route(
    answer_id: int,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        answer = session.get(Answer, answer_id)
        if not answer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")

        question = session.get(Question, answer.question_id)
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

        # Critical guard: only approved verified text can be evaluated
        if answer.verification_status != "approved" or not answer.verified_text or not answer.verified_text.strip():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot evaluate: answer text not approved"
            )

        try:
            result = evaluate_answer(
                question_text=question.question_text,
                max_marks=question.max_marks,
                reference_answer=question.reference_answer,
                marking_criteria=question.marking_criteria,
                verified_text=answer.verified_text,
            )
        except Exception:
            answer.evaluation_status = "failed"
            answer.updated_at = datetime.now(timezone.utc)
            session.add(answer)
            session.commit()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI evaluation failed"
            )

        answer.ai_marks = result["marks"]
        answer.ai_feedback = result["feedback"]
        answer.key_points_found = json.dumps(result["key_points_found"])
        answer.missing_points = json.dumps(result["missing_points"])
        answer.teacher_marks = None
        answer.final_marks = result["marks"]
        answer.evaluation_status = "evaluated"
        answer.updated_at = datetime.now(timezone.utc)

        session.add(answer)
        session.commit()
        session.refresh(answer)

        return _build_answer_read(answer, question)

@router.put("/answers/{answer_id}/marks", response_model=AnswerRead)
def override_marks(
    answer_id: int,
    body: OverrideMarksRequest,
    current_user: str = Depends(get_current_teacher)
):
    with Session(engine) as session:
        answer = session.get(Answer, answer_id)
        if not answer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")

        question = session.get(Question, answer.question_id)
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

        if answer.evaluation_status not in ["evaluated", "finalized"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot override marks before evaluation"
            )

        if body.marks < 0 or body.marks > question.max_marks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Marks must be between 0 and {question.max_marks}"
            )

        answer.teacher_marks = body.marks
        answer.final_marks = body.marks
        answer.evaluation_status = "finalized"
        answer.updated_at = datetime.now(timezone.utc)

        session.add(answer)
        session.commit()
        session.refresh(answer)

        return _build_answer_read(answer, question)
