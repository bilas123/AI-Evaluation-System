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

def test_submission_lifecycle_and_upload():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create an Exam
        exam_res = client.post("/api/exams", json={
            "title": "Algorithms Quiz",
            "subject": "CS",
            "questions": [
                {
                    "question_text": "What is MergeSort?",
                    "max_marks": 5.0,
                    "reference_answer": "Divide and conquer sorting.",
                    "marking_criteria": "5 marks for clear definition"
                }
            ]
        }, headers=headers)
        exam_id = exam_res.json()["id"]
        q_id = exam_res.json()["questions"][0]["id"]

        # 2. Create Submission
        sub_res = client.post(
            f"/api/exams/{exam_id}/submissions",
            json={"student_label": "Student 01"},
            headers=headers
        )
        assert sub_res.status_code == 201
        sub_data = sub_res.json()
        sub_id = sub_data["id"]
        assert sub_data["student_label"] == "Student 01"
        assert len(sub_data["answers"]) == 1
        assert sub_data["answers"][0]["question_id"] == q_id
        assert sub_data["answers"][0]["ocr_status"] == "pending"

        # 3. List Submissions
        list_res = client.get(f"/api/exams/{exam_id}/submissions", headers=headers)
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1

        # 4. Upload Answer Image with Mocked OCR
        fake_result = OcrResult(
            text="MergeSort divides the array in halves and then merges them.",
            engine="gemini",
            status="reliable",
            note="Extracted using Gemini Vision"
        )
        with patch("app.routes.submissions.extract_text", return_value=fake_result):
            img_bytes = _create_sample_image()
            upload_res = client.post(
                f"/api/submissions/{sub_id}/answers/{q_id}/image",
                files={"file": ("answer.jpg", img_bytes, "image/jpeg")},
                headers=headers
            )
            assert upload_res.status_code == 200
            ans_data = upload_res.json()
            assert ans_data["ocr_text"] == fake_result.text
            assert ans_data["ocr_engine"] == "gemini"
            assert ans_data["ocr_status"] == "reliable"
            assert ans_data["verification_status"] == "unverified"
            answer_id = ans_data["id"]

        # 5. Fetch Answer Image
        img_res = client.get(f"/api/answers/{answer_id}/image", headers=headers)
        assert img_res.status_code == 200
        assert img_res.headers["content-type"] == "image/jpeg"

        # 6. Re-run OCR
        with patch("app.routes.submissions.extract_text", return_value=fake_result):
            rerun_res = client.post(f"/api/answers/{answer_id}/ocr", headers=headers)
            assert rerun_res.status_code == 200
            assert rerun_res.json()["ocr_status"] == "reliable"

def test_upload_invalid_image_format():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        # Create exam & submission
        exam_res = client.post("/api/exams", json={
            "title": "Test Exam",
            "subject": "CS",
            "questions": [{"question_text": "Q1", "max_marks": 5, "reference_answer": "A1", "marking_criteria": "C1"}]
        }, headers=headers)
        exam_id = exam_res.json()["id"]
        q_id = exam_res.json()["questions"][0]["id"]
        sub_res = client.post(f"/api/exams/{exam_id}/submissions", json={"student_label": "Student 02"}, headers=headers)
        sub_id = sub_res.json()["id"]

        # Upload plain text as image
        bad_file = b"This is not a real image file."
        upload_res = client.post(
            f"/api/submissions/{sub_id}/answers/{q_id}/image",
            files={"file": ("fake.jpg", bad_file, "image/jpeg")},
            headers=headers
        )
        assert upload_res.status_code == 400
        assert "Invalid image file" in upload_res.json()["detail"]
