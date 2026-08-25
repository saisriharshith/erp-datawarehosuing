"""
Unit & Integration Tests for Flask REST API Endpoints
-----------------------------------------------------
"""

import pytest
import json
from backend.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Test /api/health endpoint."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "ok"
    assert "database" in data


def test_dashboard_analytics(client):
    """Test /api/analytics/dashboard endpoint."""
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    kpis = json_data["data"]["summary_kpis"]
    assert "total_students" in kpis
    assert "average_attendance" in kpis
    assert "average_marks" in kpis
    assert "fee_collection_rate" in kpis
    assert "data_quality_score" in kpis


def test_students_api(client):
    """Test /api/students list and pagination."""
    res = client.get("/api/students?page=1&limit=10")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "students" in data
    assert len(data["students"]) <= 10


def test_attendance_summary(client):
    """Test /api/attendance/summary endpoint."""
    res = client.get("/api/attendance/summary")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "status_breakdown" in data
    assert "average_overall" in data


def test_examinations_summary(client):
    """Test /api/examinations/summary endpoint."""
    res = client.get("/api/examinations/summary")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "pass_percentage" in data
    assert "average_score" in data


def test_fees_summary(client):
    """Test /api/fees/summary endpoint."""
    res = client.get("/api/fees/summary")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "collection_rate" in data
    assert "total_collected" in data


def test_data_quality_api(client):
    """Test /api/data-quality endpoint."""
    res = client.get("/api/data-quality")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "latest_report" in data
    assert "dimensions" in data["latest_report"]


def test_predict_risk_api(client):
    """Test /api/predict-risk POST endpoint."""
    payload = {
        "attendance_percentage": 55.0,
        "previous_gpa": 5.2,
        "internal_marks_avg": 40.0,
        "failed_subjects": 2,
        "fee_outstanding_ratio": 0.3,
        "library_usage": 1
    }
    res = client.post("/api/predict-risk", json=payload)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["predicted_risk_level"] == "HIGH"
    assert len(data["risk_factors"]) > 0


def test_what_if_simulation_api(client):
    """Test /api/simulate-scenario POST endpoint."""
    payload = {
        "student_id": "STU2023001",
        "interventions": {
            "target_attendance": 85.0,
            "cleared_backlogs": 1
        }
    }
    res = client.post("/api/simulate-scenario", json=payload)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "baseline" in data
    assert "simulated" in data
    assert "impact_summary" in data


def test_auth_login(client):
    """Test /api/auth/login with valid demo credentials."""
    payload = {
        "email": "admin@univ.edu",
        "password": "demo1234"
    }
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["role"] == "ADMIN"
    assert "token" in data
