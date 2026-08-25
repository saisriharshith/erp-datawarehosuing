"""
Fees Route Blueprint
--------------------
Serves fee collection rate, outstanding dues, and payment methods.
"""

from flask import Blueprint, request
from backend.services.analytics_service import AnalyticsService
from backend.utils.helpers import success_response

fees_bp = Blueprint("fees", __name__)


@fees_bp.route("/fees/summary", methods=["GET"])
def get_fees_summary():
    """Fee collection summary and dues analytics."""
    dept_id = request.args.get("department_id")
    sem_raw = request.args.get("semester")
    semester = int(sem_raw) if sem_raw and sem_raw.isdigit() else None

    data = AnalyticsService.get_fees_analytics(dept_id=dept_id, semester=semester)
    return success_response(data=data, message="Fees analytics fetched successfully")
