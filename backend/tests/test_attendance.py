"""
Attendance Session Lifecycle & Duplicate Prevention Tests
"""

from datetime import datetime, timezone
import cv2
import numpy as np
import pytest
from httpx import AsyncClient
from backend.app.services.face_recognition import recognition_index
from backend.app.utils.image_processing import encode_image_to_base64


@pytest.mark.asyncio
async def test_attendance_session_full_lifecycle(
    client: AsyncClient,
    lecturer_auth,
    init_test_db
):
    db = init_test_db
    headers = {"Authorization": lecturer_auth["Authorization"]}
    lec_uid = lecturer_auth["user_id"]

    # 1. Setup Academic Entities
    c_res = await db.courses.insert_one({"course_code": "CS-ATT", "title": "Attendance CS", "is_active": True})
    course_id = str(c_res.inserted_id)

    u_res = await db.units.insert_one({"unit_code": "UN-ATT", "name": "Attendance Unit", "course_id": course_id, "is_active": True})
    unit_id = str(u_res.inserted_id)

    v_res = await db.venues.insert_one({"venue_code": "VN-ATT", "name": "Attendance Hall", "is_active": True})
    venue_id = str(v_res.inserted_id)

    # 2. Setup an enrolled student with synthetic embedding
    st_res = await db.students.insert_one({
        "student_id": "REG/ATT/01",
        "full_name": "Test Present Student",
        "email": "present@college.edu",
        "course_id": course_id,
        "face_enrollment_status": "ENROLLED",
        "enrolled_samples_count": 5
    })

    # 3. Create Session
    create_sess_res = await client.post(
        "/api/v1/attendance/sessions",
        headers=headers,
        json={
            "course_id": course_id,
            "unit_id": unit_id,
            "venue_id": venue_id,
            "notes": "Testing attendance lifecycle"
        }
    )
    assert create_sess_res.status_code == 201
    sess_data = create_sess_res.json()
    session_id = sess_data["id"]
    assert sess_data["status"] == "CREATED"
    assert sess_data["total_present"] == 0

    # 4. Starting the session
    start_res = await client.post(f"/api/v1/attendance/sessions/{session_id}/start", headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "ACTIVE"

    # 5. Build an image frame for recognition
    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Draw a mock face rectangle
    cv2.rectangle(dummy_img, (150, 100), (350, 350), (255, 255, 255), -1)
    img_b64 = encode_image_to_base64(dummy_img)

    # 6. Test Recognition on Active Session
    rec_res = await client.post(
        f"/api/v1/attendance/sessions/{session_id}/recognize",
        headers=headers,
        json={"image_base64": img_b64}
    )
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "faces" in rec_data
    assert "total_present" in rec_data

    # 7. Stop the session
    stop_res = await client.post(f"/api/v1/attendance/sessions/{session_id}/stop", headers=headers)
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "COMPLETED"

    # 8. Verifying completed session rejects subsequent recognition frames
    rejected_rec = await client.post(
        f"/api/v1/attendance/sessions/{session_id}/recognize",
        headers=headers,
        json={"image_base64": img_b64}
    )
    assert rejected_rec.status_code == 400
    assert "COMPLETED" in rejected_rec.json()["error"]["message"]


@pytest.mark.asyncio
async def test_database_duplicate_attendance_prevention(init_test_db):
    db = init_test_db
    session_id = "test_session_123"
    student_id = "test_student_456"

    now = datetime.now(timezone.utc)
    record1 = {
        "session_id": session_id,
        "student_id": student_id,
        "status": "PRESENT",
        "marked_at": now
    }

    # First insertion succeeds
    await db.attendance_records.insert_one(record1)

    # Second insertion with same (session_id, student_id) MUST trigger DuplicateKeyError
    import pymongo
    with pytest.raises(pymongo.errors.DuplicateKeyError):
        await db.attendance_records.insert_one({
            "session_id": session_id,
            "student_id": student_id,
            "status": "PRESENT",
            "marked_at": now
        })
