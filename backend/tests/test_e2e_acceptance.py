"""
End-to-End Acceptance Scenario Test for VisionAttend
Validates complete user journey:
Admin Login -> Settings -> Student Registration -> ArcFace Biometrics ->
Lecturer Login -> Session Launch -> Live Recognition Marking ->
Duplicate Prevention -> Session Stop -> Multi-format Report Exports.
"""

import pytest
import numpy as np
from bson import ObjectId
from httpx import AsyncClient
from backend.app.core.security import get_password_hash
from backend.app.services.face_recognition import recognition_index
from backend.app.services.attendance_service import attendance_service


@pytest.mark.asyncio
async def test_full_e2e_acceptance_flow(client: AsyncClient, init_test_db):
    db = init_test_db

    # Seed Admin & Lecturer into test db
    await db.users.insert_many([
        {
            "email": "e2e_admin@college.edu",
            "hashed_password": get_password_hash("Admin@12345"),
            "full_name": "E2E Administrator",
            "role": "ADMIN",
            "is_active": True
        },
        {
            "email": "e2e_lecturer@college.edu",
            "hashed_password": get_password_hash("Lecturer@12345"),
            "full_name": "Prof. E2E Smith",
            "role": "LECTURER",
            "is_active": True
        }
    ])

    # ============================================================
    # 1. ADMIN AUTHENTICATION & SETTINGS
    # ============================================================
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "e2e_admin@college.edu", "password": "Admin@12345"}
    )
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Check settings & reset threshold to standard 0.45
    settings_put = await client.put(
        "/api/v1/admin/settings",
        json={"face_similarity_threshold": 0.45},
        headers=admin_headers
    )
    assert settings_put.status_code == 200
    settings_data = settings_put.json()
    assert settings_data["face_similarity_threshold"] == 0.45
    assert "buffalo" in settings_data["model_name"]

    # ============================================================
    # 2. CREATE DEGREE PROGRAM, UNIT, VENUE
    # ============================================================
    course_res = await client.post(
        "/api/v1/courses",
        json={
            "course_code": "SE2026",
            "title": "Software Engineering Degree",
            "department": "Department of Computing",
            "credits": 4,
            "duration_years": 4
        },
        headers=admin_headers
    )
    assert course_res.status_code == 201
    course_id = course_res.json()["id"]

    unit_res = await client.post(
        "/api/v1/units",
        json={
            "unit_code": "SE-401",
            "name": "Cloud Distributed Systems",
            "course_id": course_id,
            "credit_hours": 3
        },
        headers=admin_headers
    )
    assert unit_res.status_code == 201
    unit_id = unit_res.json()["id"]

    venue_res = await client.post(
        "/api/v1/venues",
        json={
            "venue_code": "AUD-1",
            "name": "Alan Turing Auditorium",
            "building": "Computing Block",
            "room_number": "101",
            "capacity": 100,
            "venue_type": "AUDITORIUM"
        },
        headers=admin_headers
    )
    assert venue_res.status_code == 201
    venue_id = venue_res.json()["id"]

    # ============================================================
    # 3. REGISTER STUDENT & BIOMETRIC ENROLLMENT
    # ============================================================
    student_res = await client.post(
        "/api/v1/students",
        json={
            "first_name": "Grace",
            "last_name": "Hopper",
            "registration_number": "SC/E2E/2026",
            "email": "grace.hopper@college.edu",
            "phone_number": "+1234567890",
            "course_id": course_id,
            "academic_year": 3,
            "semester": 1
        },
        headers=admin_headers
    )
    assert student_res.status_code == 201
    student_data = student_res.json()
    student_id = student_data["id"]
    assert student_data["face_enrollment_status"] == "PENDING"

    # Register synthetic 512-D vectors into DB and build recognition index
    synthetic_vector = np.random.randn(512).astype(np.float32)
    synthetic_vector /= np.linalg.norm(synthetic_vector)

    def random_unit():
        v = np.random.randn(512).astype(np.float32)
        return v / np.linalg.norm(v)

    # Ingest 3 samples for Grace Hopper
    for idx in range(1, 4):
        noise = 0.96 * synthetic_vector + 0.04 * random_unit()
        sample_vec = (noise / np.linalg.norm(noise)).tolist()
        await db.face_embeddings.insert_one({
            "student_id": "SC/E2E/2026",
            "embedding": sample_vec,
            "sample_index": idx
        })

    # Update MongoDB student enrollment status for test scenario
    await db.students.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"face_enrollment_status": "ENROLLED", "enrolled_samples_count": 3}}
    )

    # Rebuild recognition index
    await recognition_index.build_from_database(db)

    # Verify profile updated
    get_st_res = await client.get(f"/api/v1/students/{student_id}", headers=admin_headers)
    assert get_st_res.status_code == 200
    assert get_st_res.json()["face_enrollment_status"] == "ENROLLED"
    assert get_st_res.json()["enrolled_samples_count"] == 3

    # ============================================================
    # 4. LECTURER LOGIN & SESSION INITIALIZATION
    # ============================================================
    lec_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "e2e_lecturer@college.edu", "password": "Lecturer@12345"}
    )
    assert lec_login.status_code == 200
    lec_token = lec_login.json()["access_token"]
    lec_headers = {"Authorization": f"Bearer {lec_token}"}

    # Create session
    create_sess = await client.post(
        "/api/v1/attendance/sessions",
        json={
            "course_id": course_id,
            "unit_id": unit_id,
            "venue_id": venue_id,
            "notes": "E2E Live Verification Demonstration"
        },
        headers=lec_headers
    )
    assert create_sess.status_code == 201
    session_id = create_sess.json()["id"]

    # Start session
    start_res = await client.post(
        f"/api/v1/attendance/sessions/{session_id}/start",
        headers=lec_headers
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "ACTIVE"

    # ============================================================
    # 5. LIVE RECOGNITION & DUPLICATE PREVENTION
    # ============================================================
    probe_vector = 0.95 * synthetic_vector + 0.05 * random_unit()
    probe_vector = (probe_vector / np.linalg.norm(probe_vector)).tolist()
    match_result = recognition_index.match_face(probe_vector, threshold=0.45)
    assert match_result.is_recognized is True
    assert match_result.student_id == "SC/E2E/2026"
    assert match_result.similarity_score > 0.85

    import pymongo
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    # First attendance marking for Grace Hopper in this session
    rec1 = {
        "session_id": session_id,
        "student_id": "SC/E2E/2026",
        "student_name": "Grace Hopper",
        "course_id": course_id,
        "unit_id": unit_id,
        "venue_id": venue_id,
        "lecturer_id": str(create_sess.json().get("lecturer_id", "")),
        "status": "PRESENT",
        "marked_at": now,
        "similarity_score": float(match_result.similarity_score),
        "verified_method": "INSIGHTFACE_ARCFACE"
    }
    await db.attendance_records.insert_one(rec1)
    await db.attendance_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$inc": {"total_present": 1}}
    )

    # Duplicate prevention: immediate re-insertion of same (session_id, student_id) must trigger DuplicateKeyError
    with pytest.raises(pymongo.errors.DuplicateKeyError):
        await db.attendance_records.insert_one({
            "session_id": session_id,
            "student_id": "SC/E2E/2026",
            "student_name": "Grace Hopper",
            "status": "PRESENT",
            "marked_at": now
        })

    # Inspect session records via API
    records_res = await client.get(
        f"/api/v1/attendance/sessions/{session_id}/records",
        headers=lec_headers
    )
    assert records_res.status_code == 200
    records = records_res.json()
    assert len(records) == 1, "Duplicate record was incorrectly permitted!"
    assert records[0]["student_id"] == "SC/E2E/2026"

    # ============================================================
    # 6. STOP SESSION
    # ============================================================
    stop_res = await client.post(
        f"/api/v1/attendance/sessions/{session_id}/stop",
        headers=lec_headers
    )
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "COMPLETED"

    # ============================================================
    # 7. EXPORT AUDIT REPORTS (CSV, EXCEL, PDF)
    # ============================================================
    # CSV Export
    csv_res = await client.get(
        f"/api/v1/reports/export/csv?unit_id={unit_id}",
        headers=lec_headers
    )
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Grace Hopper" in csv_res.text or "SC/E2E/2026" in csv_res.text

    # Excel Export (.xlsx)
    excel_res = await client.get(
        f"/api/v1/reports/export/excel?unit_id={unit_id}",
        headers=lec_headers
    )
    assert excel_res.status_code == 200
    assert excel_res.content[:4] == b"PK\x03\x04"

    # PDF Export
    pdf_res = await client.get(
        f"/api/v1/reports/export/pdf?unit_id={unit_id}",
        headers=lec_headers
    )
    assert pdf_res.status_code == 200
    assert pdf_res.content[:4] == b"%PDF"

    # ============================================================
    # 8. ADMIN ANALYTICS TELEMETRY
    # ============================================================
    analytics_res = await client.get("/api/v1/analytics/admin", headers=admin_headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["total_students"] >= 1
    assert analytics_data["total_courses"] >= 1
    assert analytics_data["today_sessions_count"] >= 1
