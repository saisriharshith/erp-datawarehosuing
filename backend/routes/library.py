"""
Library Route Blueprint
-----------------------
Serves library resource usage, book circulation, and fine records.
"""

from flask import Blueprint
from backend.services.analytics_service import AnalyticsService
from backend.utils.helpers import success_response

library_bp = Blueprint("library", __name__)


@library_bp.route("/library/summary", methods=["GET"])
def get_library_summary():
    """Library usage metrics."""
    data = AnalyticsService.get_library_summary()
    return success_response(data=data, message="Library analytics fetched successfully")
