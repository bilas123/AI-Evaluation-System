from fastapi.testclient import TestClient
from app.main import app

def test_login_success():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"username": "teacher", "password": "teacher123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["username"] == "teacher"

def test_login_invalid_password():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"username": "teacher", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"

def test_protected_route_with_and_without_token():
    with TestClient(app) as client:
        # Without token
        unauth_response = client.get("/api/auth/me")
        assert unauth_response.status_code == 401

        # With valid token
        login_res = client.post(
            "/api/auth/login",
            json={"username": "teacher", "password": "teacher123"}
        )
        token = login_res.json()["token"]
        auth_response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert auth_response.status_code == 200
        assert auth_response.json() == {"username": "teacher"}
