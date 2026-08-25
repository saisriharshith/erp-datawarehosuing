"""
API Utilities & Response Formatters
-----------------------------------
Standardizes REST API JSON response envelopes, error structures, and type serializers.
"""

from flask import jsonify
from datetime import datetime


def success_response(data=None, message="Success", status_code=200, meta=None):
    """Formats standard JSON success payload."""
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def error_response(message="An error occurred", status_code=400, errors=None):
    """Formats standard JSON error payload."""
    payload = {
        "success": False,
        "message": message,
        "status_code": status_code
    }
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code
