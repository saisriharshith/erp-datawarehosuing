"""
Face Enrollment Lookup Tests for MongoDB ObjectId & Registration Number
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_enrollment_lookup_by_both_id_formats(client: AsyncClient, admin_auth, init_test_db):
    db = init_test_db
    headers = {"Authorization": admin_auth["Authorization"]}

    # Insert test course and student
    c_res = await db.courses.insert_one({"course_code": "LOOKUP-CS", "title": "Lookup Course", "is_active": True})
    s_doc = {
        "student_id": "LKP-2026-001",
        "full_name": "Test Lookup Student",
        "email": "lookup.student@college.edu",
        "course_id": str(c_res.inserted_id),
        "year": 1,
        "section": "A",
        "status": "ACTIVE",
        "face_enrollment_status": "PENDING",
        "enrolled_samples_count": 0,
        "primary_photo_url": None
    }
    s_res = await db.students.insert_one(s_doc)
    mongo_id = str(s_res.inserted_id)

    # 1. Test lookup by MongoDB ObjectId string (which frontend sends via student.id)
    res_oid = await client.get(f"/api/v1/enrollment/{mongo_id}/info", headers=headers)
    assert res_oid.status_code == 200, res_oid.text
    data_oid = res_oid.json()
    assert data_oid["student_id"] == "LKP-2026-001"
    assert data_oid["full_name"] == "Test Lookup Student"
    assert data_oid["enrolled_samples_count"] == 0

    # 2. Test lookup by human-readable student_id registration code
    res_sid = await client.get("/api/v1/enrollment/LKP-2026-001/info", headers=headers)
    assert res_sid.status_code == 200, res_sid.text
    data_sid = res_sid.json()
    assert data_sid["student_id"] == "LKP-2026-001"
    assert data_sid["full_name"] == "Test Lookup Student"

    # 3. Test non-existent student ID returns 404
    res_404 = await client.get("/api/v1/enrollment/666666666666666666666666/info", headers=headers)
    assert res_404.status_code == 404
