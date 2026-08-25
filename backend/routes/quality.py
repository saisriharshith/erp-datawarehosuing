"""
Data Quality Route Blueprint
----------------------------
Serves ETL execution audit logs, 5-dimension quality metrics, and sanitation reports.
"""

from flask import Blueprint
from backend.services.quality_service import QualityService
from backend.utils.helpers import success_response

quality_bp = Blueprint("quality", __name__)


@quality_bp.route("/data-quality", methods=["GET"])
def get_data_quality():
    """Fetches latest Data Quality audit report and dimension metrics."""
    data = QualityService.get_latest_quality_report()
    return success_response(data=data, message="Data quality report fetched successfully")
