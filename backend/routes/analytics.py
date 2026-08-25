"""
Analytics Route Blueprint
-------------------------
Serves institutional dashboard KPIs, departmental distributions, and data lineage.
"""

from flask import Blueprint, request
from backend.services.analytics_service import AnalyticsService
from backend.utils.helpers import success_response, error_response

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics/dashboard", methods=["GET"])
def get_dashboard():
    """Fetches high-level executive dashboard metrics with optional filters."""
    dept_id = request.args.get("department_id")
    semester_raw = request.args.get("semester")
    semester = int(semester_raw) if semester_raw and semester_raw.isdigit() else None

    data = AnalyticsService.get_dashboard_summary(dept_id=dept_id, semester=semester)
    return success_response(data=data, message="Dashboard metrics fetched successfully")


@analytics_bp.route("/analytics/lineage", methods=["GET"])
def get_data_lineage():
    """Fetches Data Lineage provenance records."""
    metric_key = request.args.get("metric")
    data = AnalyticsService.get_kpi_lineage(metric_key=metric_key)
    return success_response(data=data, message="Data lineage records fetched successfully")
