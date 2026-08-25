"""
Attendance Route Blueprint
--------------------------
Serves institutional attendance metrics, shortage alerts, and trends.
"""

from flask import Blueprint, request
from backend.services.analytics_service import AnalyticsService
from backend.utils.helpers import success_response

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/attendance/summary", methods=["GET"])
def get_attendance_summary():
    """Attendance summary with status distributions."""
    dept_id = request.args.get("department_id")
    sem_raw = request.args.get("semester")
    semester = int(sem_raw) if sem_raw and sem_raw.isdigit() else None

    data = AnalyticsService.get_attendance_analytics(dept_id=dept_id, semester=semester)
    return success_response(data=data, message="Attendance analytics fetched successfully")
