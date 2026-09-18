"""
Academic Management Tests: Courses, Units, and Venues
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_courses(client: AsyncClient, admin_auth):
    headers = {"Authorization": admin_auth["Authorization"]}
    
    # 1. Create Course
    res = await client.post(
        "/api/v1/courses",
        headers=headers,
        json={
            "course_code": "TEST-CS",
            "title": "Test Computer Science",
            "department": "Computing",
            "credits": 4,
            "duration_years": 4
        }
    )
    assert res.status_code == 201
    course_data = res.json()
    assert course_data["course_code"] == "TEST-CS"
    course_id = course_data["id"]

    # 2. Reject duplicate course_code
    dup_res = await client.post(
        "/api/v1/courses",
        headers=headers,
        json={
            "course_code": "TEST-CS",
            "title": "Duplicate CS",
            "department": "Computing",
            "credits": 4
        }
    )
    assert dup_res.status_code == 400

    # 3. Create Unit linked to Course
    unit_res = await client.post(
        "/api/v1/units",
        headers=headers,
        json={
            "unit_code": "CS-999",
            "name": "Distributed Systems",
            "course_id": course_id,
            "credit_hours": 3
        }
    )
    assert unit_res.status_code == 201
    unit_data = unit_res.json()
    assert unit_data["unit_code"] == "CS-999"

    # 4. Create Venue
    venue_res = await client.post(
        "/api/v1/venues",
        headers=headers,
        json={
            "venue_code": "TEST-LH1",
            "name": "Test Lecture Hall",
            "building": "Test Block",
            "room_number": "101",
            "capacity": 50,
            "venue_type": "LECTURE_HALL"
        }
    )
    assert venue_res.status_code == 201
    venue_data = venue_res.json()
    assert venue_data["venue_code"] == "TEST-LH1"

    # 5. List Courses
    list_res = await client.get("/api/v1/courses", headers=headers)
    assert list_res.status_code == 200
    courses = list_res.json()
    assert any(c["course_code"] == "TEST-CS" for c in courses)
