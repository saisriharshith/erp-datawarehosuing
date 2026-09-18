"""
Student Management Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_crud(client: AsyncClient, admin_auth, init_test_db):
    db = init_test_db
    headers = {"Authorization": admin_auth["Authorization"]}

    # First create a course
    c_res = await db.courses.insert_one({"course_code": "ST-CS", "title": "CS", "is_active": True})
    course_id = str(c_res.inserted_id)

    # 1. Create Student
    student_payload = {
        "student_id": "TEST/2026/001",
        "full_name": "Test Student A",
        "email": "studentA@college.edu",
        "phone": "+123456789",
        "gender": "Female",
        "course_id": course_id,
        "year": 1,
        "section": "A"
    }
    create_res = await client.post("/api/v1/students", headers=headers, json=student_payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["student_id"] == "TEST/2026/001"
    assert data["face_enrollment_status"] == "PENDING"
    student_db_id = data["id"]

    # 2. Reject duplicate student ID
    dup_res = await client.post("/api/v1/students", headers=headers, json=student_payload)
    assert dup_res.status_code == 400

    # 3. Retrieve student detail
    get_res = await client.get(f"/api/v1/students/{student_db_id}", headers=headers)
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["full_name"] == "Test Student A"
    assert detail["attendance_percentage"] == 0.0

    # 4. Update student
    update_res = await client.put(
        f"/api/v1/students/{student_db_id}",
        headers=headers,
        json={"full_name": "Test Student A (Updated)", "section": "B"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Test Student A (Updated)"
    assert update_res.json()["section"] == "B"

    # 5. Delete student
    del_res = await client.delete(f"/api/v1/students/{student_db_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    verify_res = await client.get(f"/api/v1/students/{student_db_id}", headers=headers)
    assert verify_res.status_code == 404
