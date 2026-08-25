"""
Health Check Route Blueprint
----------------------------
Provides service liveness, readiness, and database diagnostics.
"""

from flask import Blueprint, jsonify
from backend.extensions import db_manager

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Returns backend system status and database connection health."""
    db_health = db_manager.check_health()
    return jsonify({
        "status": "ok",
        "service": "ERP Data Warehouse & Decision Support API",
        "version": "1.0.0",
        "database": db_health
    }), 200
