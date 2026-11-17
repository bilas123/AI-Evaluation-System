import io
from unittest.mock import patch
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.services.ocr_service import OcrResult

def _get_token(client):
    res = client.post("/api/auth/login", json={"username": "teacher", "password": "teacher123"})
    return res.json()["token"]

def _create_sample_image() -> bytes:
    img = Image.new("RGB", (100, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def _setup_exam_and_submission(client, headers):
    exam_res = client.post("/api/exams", json={
        "title": "Grading Unit Test Exam",
        "subject": "CS",
        "questions": [
            {
                "question_text": "Define polymorphism in OOP.",
                "max_marks": 5.0,
                "reference_answer": "Polymorphism allows objects of different classes to be treated as objects of a common superclass.",
                "marking_criteria": "3 marks for concept definition, 2 marks for valid example"
            }
        ]
    }, headers=headers)
    exam_id = exam_res.json()["id"]
    q_id = exam_res.json()["questions"][0]["id"]

    sub_res = client.post(
        f"/api/exams/{exam_id}/submissions",
        json={"student_label": "Grading Student 01"},
        headers=headers
    )
    sub_id = sub_res.json()["id"]

    fake_ocr = OcrResult(
        text="Polymorphism is many forms in OOP.",
        engine="gemini",
        status="reliable",
        note="mocked"
    )
    with patch("app.routes.submissions.extract_text", return_value=fake_ocr):
        upload_res = client.post(
            f"/api/submissions/{sub_id}/answers/{q_id}/image",
            files={"file": ("ans.jpg", _create_sample_image(), "image/jpeg")},
            headers=headers
        )
    ans_id = upload_res.json()["id"]
    return exam_id, sub_id, q_id, ans_id

def test_approve_and_reject_verified_text():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        exam_id, sub_id, q_id, ans_id = _setup_exam_and_submission(client, headers)

        # 1. Approve with empty text should fail
        empty_res = client.put(
            f"/api/answers/{ans_id}/verified-text",
            json={"text": "   "},
            headers=headers
        )
        assert empty_res.status_code == 400

        # 2. Approve valid text
        approve_res = client.put(
            f"/api/answers/{ans_id}/verified-text",
            json={"text": "Polymorphism means many forms, e.g. method overriding."},
            headers=headers
        )
        assert approve_res.status_code == 200
        data = approve_res.json()
        assert data["verification_status"] == "approved"
        assert "method overriding" in data["verified_text"]

        # 3. Reject answer
        reject_res = client.post(
            f"/api/answers/{ans_id}/reject",
            headers=headers
        )
        assert reject_res.status_code == 200
        assert reject_res.json()["verification_status"] == "rejected"
        assert reject_res.json()["verified_text"] is None

def test_evaluation_guards_unapproved():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        exam_id, sub_id, q_id, ans_id = _setup_exam_and_submission(client, headers)

        # Answer is currently unverified - must return 409
        eval_res = client.post(f"/api/answers/{ans_id}/evaluate", headers=headers)
        assert eval_res.status_code == 409
        assert "not approved" in eval_res.json()["detail"]

def test_evaluation_lifecycle_and_override():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        exam_id, sub_id, q_id, ans_id = _setup_exam_and_submission(client, headers)

        # Approve text first
        client.put(
            f"/api/answers/{ans_id}/verified-text",
            json={"text": "Polymorphism allows one interface for multiple types."},
            headers=headers
        )

        # Mock grading service
        fake_result = {
            "marks": 3.5,
            "feedback": "Clear definition given, but missing concrete code example.",
            "key_points_found": ["Definition of polymorphism", "Interface usage"],
            "missing_points": ["Code example"]
        }
        with patch("app.routes.submissions.evaluate_answer", return_value=fake_result):
            eval_res = client.post(f"/api/answers/{ans_id}/evaluate", headers=headers)
            assert eval_res.status_code == 200
            eval_data = eval_res.json()
            assert eval_data["evaluation_status"] == "evaluated"
            assert eval_data["ai_marks"] == 3.5
            assert eval_data["final_marks"] == 3.5
            assert eval_data["ai_feedback"] == fake_result["feedback"]
            assert "Definition of polymorphism" in eval_data["key_points_found"]

        # Teacher override marks
        override_res = client.put(
            f"/api/answers/{ans_id}/marks",
            json={"marks": 4.0},
            headers=headers
        )
        assert override_res.status_code == 200
        over_data = override_res.json()
        assert over_data["evaluation_status"] == "finalized"
        assert over_data["teacher_marks"] == 4.0
        assert over_data["final_marks"] == 4.0
        assert over_data["ai_marks"] == 3.5

        # Check results endpoint
        results_res = client.get(f"/api/exams/{exam_id}/results", headers=headers)
        assert results_res.status_code == 200
        res_data = results_res.json()
        assert res_data["total_max_marks"] == 5.0
        assert len(res_data["submissions"]) == 1
        assert res_data["submissions"][0]["total_final_marks"] == 4.0

        # Updating verified text after evaluation should reset evaluation status
        reset_res = client.put(
            f"/api/answers/{ans_id}/verified-text",
            json={"text": "Modified verified student text."},
            headers=headers
        )
        assert reset_res.status_code == 200
        reset_data = reset_res.json()
        assert reset_data["evaluation_status"] == "not_evaluated"
        assert reset_data["ai_marks"] is None
        assert reset_data["final_marks"] is None
