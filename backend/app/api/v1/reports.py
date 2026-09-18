"""
Reports and Data Export API Endpoints
Supports JSON summary, CSV, Excel, and PDF exports.
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...models.user import UserModel
from ...schemas.analytics_reports import ReportFilter, ReportSummaryResponse
from ...services.report_service import report_service
from ..deps import get_current_user, get_db, require_lecturer_or_admin

router = APIRouter(prefix="/reports", tags=["Reports"])


def _extract_filter(
    course_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    lecturer_id: Optional[str] = None,
    student_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> ReportFilter:
    return ReportFilter(
        course_id=course_id,
        unit_id=unit_id,
        venue_id=venue_id,
        lecturer_id=lecturer_id,
        student_id=student_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/attendance", response_model=ReportSummaryResponse)
async def get_attendance_report(
    course_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    lecturer_id: Optional[str] = None,
    student_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Retrieves structured attendance report records."""
    filters = _extract_filter(course_id, unit_id, venue_id, lecturer_id, student_id, start_date, end_date)
    records = await report_service.get_report_data(db, filters)

    present_count = sum(1 for r in records if r.get("status") == "PRESENT")
    total_count = len(records)
    pct = round((present_count / max(1, total_count)) * 100.0, 1)

    return ReportSummaryResponse(
        total_records=total_count,
        present_count=present_count,
        absent_count=0,
        attendance_percentage=pct,
        records=records
    )


@router.get("/export/csv")
async def export_attendance_csv(
    course_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    lecturer_id: Optional[str] = None,
    student_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Exports attendance report as CSV."""
    filters = _extract_filter(course_id, unit_id, venue_id, lecturer_id, student_id, start_date, end_date)
    records = await report_service.get_report_data(db, filters)
    stream = report_service.export_csv(records)

    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )


@router.get("/export/excel")
async def export_attendance_excel(
    course_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    lecturer_id: Optional[str] = None,
    student_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Exports styled Excel (.xlsx) attendance report."""
    filters = _extract_filter(course_id, unit_id, venue_id, lecturer_id, student_id, start_date, end_date)
    records = await report_service.get_report_data(db, filters)
    stream = report_service.export_excel(records)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_report.xlsx"}
    )


@router.get("/export/pdf")
async def export_attendance_pdf(
    course_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    lecturer_id: Optional[str] = None,
    student_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Exports formatted PDF attendance report with college header."""
    filters = _extract_filter(course_id, unit_id, venue_id, lecturer_id, student_id, start_date, end_date)
    records = await report_service.get_report_data(db, filters)
    stream = report_service.export_pdf(records)

    return StreamingResponse(
        stream,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=attendance_report.pdf"}
    )
