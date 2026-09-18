"""
Analytics and Admin Settings Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_and_lecturer_analytics(
    client: AsyncClient,
    admin_auth,
    lecturer_auth
):
    admin_headers = {"Authorization": admin_auth["Authorization"]}
    lec_headers = {"Authorization": lecturer_auth["Authorization"]}

    # Admin Analytics
    admin_analytics_res = await client.get("/api/v1/analytics/admin", headers=admin_headers)
    assert admin_analytics_res.status_code == 200
    adm_data = admin_analytics_res.json()
    assert "total_students" in adm_data
    assert "attendance_trends" in adm_data
    assert "course_stats" in adm_data

    # Lecturer Analytics
    lec_analytics_res = await client.get("/api/v1/analytics/lecturer", headers=lec_headers)
    assert lec_analytics_res.status_code == 200
    lec_data = lec_analytics_res.json()
    assert "assigned_courses_count" in lec_data
    assert "average_attendance_percentage" in lec_data


@pytest.mark.asyncio
async def test_admin_settings_update(client: AsyncClient, admin_auth):
    headers = {"Authorization": admin_auth["Authorization"]}

    # 1. Get settings
    get_res = await client.get("/api/v1/admin/settings", headers=headers)
    assert get_res.status_code == 200
    settings_data = get_res.json()
    assert "face_similarity_threshold" in settings_data

    # 2. Update threshold
    update_res = await client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"face_similarity_threshold": 0.72, "liveness_enabled": True}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["face_similarity_threshold"] == 0.72

    # 3. View audit logs
    audit_res = await client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    assert any(log["action"] == "UPDATE_SYSTEM_SETTINGS" for log in logs)
