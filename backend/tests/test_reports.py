"""
Reporting and Export Multi-Format Tests
"""

from datetime import datetime, timezone
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_report_generation_and_exports(
    client: AsyncClient,
    admin_auth,
    init_test_db
):
    db = init_test_db
    headers = {"Authorization": admin_auth["Authorization"]}

    # Seed sample attendance records
    now = datetime.now(timezone.utc)
    await db.attendance_records.insert_one({
        "session_id": "sess_report_1",
        "student_id": "ST_REP_01",
        "student_name": "Report Test Student",
        "course_id": "c1",
        "unit_id": "u1",
        "venue_id": "v1",
        "lecturer_id": admin_auth["user_id"],
        "status": "PRESENT",
        "marked_at": now,
        "similarity_score": 0.94
    })

    # 1. JSON Report
    json_res = await client.get("/api/v1/reports/attendance", headers=headers)
    assert json_res.status_code == 200
    report_data = json_res.json()
    assert report_data["total_records"] >= 1
    assert report_data["present_count"] >= 1

    # 2. CSV Export
    csv_res = await client.get("/api/v1/reports/export/csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.content) > 0
    assert b"Student ID" in csv_res.content

    # 3. Excel Export
    excel_res = await client.get("/api/v1/reports/export/excel", headers=headers)
    assert excel_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in excel_res.headers["content-type"]
    assert len(excel_res.content) > 1000  # Valid zip/xlsx structure

    # 4. PDF Export
    pdf_res = await client.get("/api/v1/reports/export/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert pdf_res.content.startswith(b"%PDF")
