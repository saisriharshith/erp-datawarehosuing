"""
Faculty Route Blueprint
-----------------------
Serves faculty workload, designations, and departmental faculty ratios.
"""

from flask import Blueprint, request
from backend.services.analytics_service import AnalyticsService
from backend.utils.helpers import success_response

faculty_bp = Blueprint("faculty", __name__)


@faculty_bp.route("/faculty/summary", methods=["GET"])
def get_faculty_summary():
    """Faculty workload and directory summary."""
    dept_id = request.args.get("department_id")
    data = AnalyticsService.get_faculty_analytics(dept_id=dept_id)
    return success_response(data=data, message="Faculty analytics fetched successfully")
