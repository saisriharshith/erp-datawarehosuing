"""
Examinations Route Blueprint
----------------------------
Serves examination pass rates, GPA distributions, and academic standing metrics.
"""

from flask import Blueprint, request
from backend.services.analytics_service import AnalyticsService
from backend.utils.helpers import success_response

examinations_bp = Blueprint("examinations", __name__)


@examinations_bp.route("/examinations/summary", methods=["GET"])
def get_examinations_summary():
    """Examination performance analytics."""
    dept_id = request.args.get("department_id")
    sem_raw = request.args.get("semester")
    semester = int(sem_raw) if sem_raw and sem_raw.isdigit() else None

    data = AnalyticsService.get_examinations_analytics(dept_id=dept_id, semester=semester)
    return success_response(data=data, message="Examination analytics fetched successfully")
