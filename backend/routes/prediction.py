"""
Decision Support & ML Route Blueprint
-------------------------------------
Serves early warning risk alerts, real-time risk classification, What-If simulation,
and model evaluation diagnostics.
"""

from flask import Blueprint, request
from backend.services.ml_service import MLService
from backend.utils.helpers import success_response, error_response

prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/risk-students", methods=["GET"])
def get_risk_students():
    """Fetches list of students flagged for academic intervention."""
    risk_level = request.args.get("risk_level")
    dept_id = request.args.get("department_id")
    sem_raw = request.args.get("semester")
    semester = int(sem_raw) if sem_raw and sem_raw.isdigit() else None

    data = MLService.get_at_risk_students(
        risk_level=risk_level,
        dept_id=dept_id,
        semester=semester
    )
    return success_response(data=data, message="Risk student alerts fetched successfully")


@prediction_bp.route("/predict-risk", methods=["POST"])
def predict_risk():
    """Calculates instantaneous risk level for provided student features."""
    body = request.get_json(silent=True) or {}
    data = MLService.predict_risk(body)
    return success_response(data=data, message="Risk prediction evaluated successfully")


@prediction_bp.route("/simulate-scenario", methods=["POST"])
def simulate_scenario():
    """Evaluates What-If scenario impact on academic risk."""
    body = request.get_json(silent=True) or {}
    student_id = body.get("student_id", "STU2023001")
    interventions = body.get("interventions", {})

    data = MLService.simulate_scenario(student_id=student_id, interventions=interventions)
    return success_response(data=data, message="Scenario simulation completed")


@prediction_bp.route("/ml-diagnostics", methods=["GET"])
def get_diagnostics():
    """Fetches ML model metrics, accuracy, and feature importances."""
    data = MLService.get_model_diagnostics()
    return success_response(data=data, message="ML model diagnostics fetched")
