from fastapi.testclient import TestClient
from app.main import app

def _get_token(client):
    res = client.post("/api/auth/login", json={"username": "teacher", "password": "teacher123"})
    return res.json()["token"]

def test_create_exam():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        body = {
            "title": "Data Structures - Unit Test 1",
            "subject": "Computer Science",
            "questions": [
                {
                    "question_text": "Explain the time complexity of QuickSort.",
                    "max_marks": 10.0,
                    "reference_answer": "Best/average O(n log n), worst O(n^2).",
                    "marking_criteria": "2 marks definition, 4 marks analysis, 4 marks example"
                },
                {
                    "question_text": "What is a Binary Search Tree?",
                    "max_marks": 5.0,
                    "reference_answer": "A tree where left < root < right for every node.",
                    "marking_criteria": "2 marks definition, 3 marks properties"
                }
            ]
        }
        res = client.post("/api/exams", json=body, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Data Structures - Unit Test 1"
        assert data["subject"] == "Computer Science"
        assert len(data["questions"]) == 2
        assert data["questions"][0]["question_number"] == 1
        assert data["questions"][1]["question_number"] == 2
        assert data["questions"][0]["max_marks"] == 10.0

def test_create_exam_no_questions():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        body = {"title": "Empty Exam", "subject": "None", "questions": []}
        res = client.post("/api/exams", json=body, headers=headers)
        assert res.status_code == 400
        assert "at least one question" in res.json()["detail"]

def test_list_exams():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        # Create an exam first
        client.post("/api/exams", json={
            "title": "Networks Quiz",
            "subject": "IT",
            "questions": [{"question_text": "What is TCP?", "max_marks": 5, "reference_answer": "A protocol.", "marking_criteria": "Definition"}]
        }, headers=headers)
        res = client.get("/api/exams", headers=headers)
        assert res.status_code == 200
        exams = res.json()
        assert len(exams) >= 1
        assert "question_count" in exams[0]

def test_get_exam_by_id():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        create_res = client.post("/api/exams", json={
            "title": "OS Midterm",
            "subject": "CS",
            "questions": [{"question_text": "What is a process?", "max_marks": 5, "reference_answer": "A running program.", "marking_criteria": "Definition"}]
        }, headers=headers)
        exam_id = create_res.json()["id"]
        res = client.get(f"/api/exams/{exam_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["title"] == "OS Midterm"
        assert len(res.json()["questions"]) == 1

def test_get_exam_not_found():
    with TestClient(app) as client:
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = client.get("/api/exams/9999", headers=headers)
        assert res.status_code == 404

def test_exams_require_auth():
    with TestClient(app) as client:
        res = client.get("/api/exams")
        assert res.status_code == 401
