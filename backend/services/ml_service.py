"""
Decision Support & ML Service
-----------------------------
Serves student risk predictions, flags early-warning cases, and executes
interactive What-If intervention simulations.
"""

from typing import Optional, Dict, Any, List
from backend.extensions import db_manager
from ml.predict import predict_student_risk, simulate_what_if_scenario
from ml.evaluate import get_evaluation_report


class MLService:
    """Decision support service wrapper."""

    @staticmethod
    def get_at_risk_students(
        risk_level: Optional[str] = None,
        dept_id: Optional[str] = None,
        semester: Optional[int] = None
    ) -> Dict[str, Any]:
        """Fetches list of students flagged for early academic intervention."""
        predictions = db_manager.get_collection_data("risk_predictions")

        if risk_level:
            predictions = [p for p in predictions if p.get("risk_level") == risk_level]
        if dept_id:
            predictions = [p for p in predictions if p.get("department_id") == dept_id]
        if semester:
            predictions = [p for p in predictions if p.get("semester") == semester]

        # Sort by risk_score descending
        predictions.sort(key=lambda x: x.get("risk_score", 0), reverse=True)

        high_count = sum(1 for p in predictions if p.get("risk_level") == "HIGH")
        med_count = sum(1 for p in predictions if p.get("risk_level") == "MEDIUM")
        low_count = sum(1 for p in predictions if p.get("risk_level") == "LOW")

        return {
            "total_flagged": len(predictions),
            "high_risk_count": high_count,
            "medium_risk_count": med_count,
            "low_risk_count": low_count,
            "students": predictions
        }

    @staticmethod
    def predict_risk(feature_dict: dict) -> dict:
        """Inference endpoint wrapper."""
        return predict_student_risk(feature_dict)

    @staticmethod
    def simulate_scenario(student_id: str, interventions: dict) -> dict:
        """Runs What-If scenario simulation for an existing student."""
        predictions = db_manager.get_collection_data("risk_predictions")
        student_pred = next((p for p in predictions if p["student_id"] == student_id), None)

        if student_pred:
            baseline_features = student_pred.get("features", {})
        else:
            baseline_features = {
                "attendance_percentage": 65.0,
                "previous_gpa": 6.0,
                "internal_marks_avg": 50.0,
                "failed_subjects": 1,
                "fee_outstanding_ratio": 0.0,
                "library_usage": 3
            }

        res = simulate_what_if_scenario(baseline_features, interventions)
        res["student_id"] = student_id
        return res

    @staticmethod
    def get_model_diagnostics() -> dict:
        """Retrieves model metrics and confusion matrix."""
        return get_evaluation_report()
