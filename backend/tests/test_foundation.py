import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "DocForge"
    assert data["status"] == "online"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["database"] is True
    assert data["data_dir_writable"] is True

def test_auth_status_endpoint():
    response = client.get("/auth/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_first_run" in data
    assert "is_authenticated" in data
