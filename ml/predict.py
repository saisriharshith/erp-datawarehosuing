"""
ML Inference & What-If Scenario Simulation Engine
-------------------------------------------------
Provides real-time academic risk prediction for individual students and
interactive What-If simulation for evaluating proposed academic interventions.
"""

import os
import json
import math

try:
    import numpy as np
except ImportError:
    np = None

# Try to load model with joblib
MODEL = None
METADATA = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "student_risk_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_metadata.json")


def load_model_artifacts():
    global MODEL, METADATA
    if os.path.exists(META_PATH):
        try:
            with open(META_PATH, "r", encoding="utf-8") as f:
                METADATA = json.load(f)
        except Exception:
            METADATA = {}

    if os.path.exists(MODEL_PATH):
        try:
            import joblib
            MODEL = joblib.load(MODEL_PATH)
        except Exception:
            MODEL = None


# Load once on module import
load_model_artifacts()


def calculate_risk_factors(features: dict) -> list:
    """Extracts interpretable plain-language risk factors from input features."""
    factors = []
    att = float(features.get("attendance_percentage", 75.0))
    gpa = float(features.get("previous_gpa", 7.0))
    internal = float(features.get("internal_marks_avg", 70.0))
    fails = int(features.get("failed_subjects", 0))
    fee_ratio = float(features.get("fee_outstanding_ratio", 0.0))
    lib = int(features.get("library_usage", 5))

    if att < 60.0:
        factors.append(f"Critical attendance shortage ({att:.1f}% vs 75% required)")
    elif att < 75.0:
        factors.append(f"Attendance below threshold ({att:.1f}%)")

    if fails >= 2:
        factors.append(f"Multiple backlogs ({fails} subjects pending)")
    elif fails == 1:
        factors.append("1 active backlog subject")

    if gpa < 5.5:
        factors.append(f"Critical academic standing ({gpa:.2f} CGPA)")
    elif gpa < 6.5:
        factors.append(f"Below average CGPA ({gpa:.2f})")

    if internal < 45.0:
        factors.append(f"Weak continuous assessment ({internal:.1f}% internal score)")

    if fee_ratio > 0.40:
        factors.append("High fee arrears pending")

    if lib <= 2:
        factors.append("Low library borrowing activity")

    if not factors:
        factors.append("Satisfactory academic progress across all indicators")

    return factors


def generate_recommendations(risk_level: str, factors: list) -> list:
    """Generates institutional decision support recommendations."""
    recs = []
    if risk_level == "HIGH":
        recs.append("Schedule mandatory 1-on-1 counseling with Academic Advisor")
        recs.append("Enroll student in remedial tutoring classes for weak subjects")
        recs.append("Issue early warning attendance notification to student and guardians")
    elif risk_level == "MEDIUM":
        recs.append("Recommend peer study group sessions")
        recs.append("Encourage regular attendance monitoring by course faculty")
    else:
        recs.append("Continue standard academic monitoring")
        recs.append("Encourage participation in advanced workshops and honors projects")
    return recs


def predict_student_risk(feature_dict: dict) -> dict:
    """
    Predicts academic risk level and probability for a given student feature dictionary.
    """
    att = float(feature_dict.get("attendance_percentage", 75.0))
    gpa = float(feature_dict.get("previous_gpa", 7.0))
    internal = float(feature_dict.get("internal_marks_avg", 70.0))
    fails = int(feature_dict.get("failed_subjects", 0))
    fee_ratio = float(feature_dict.get("fee_outstanding_ratio", 0.0))
    lib = int(feature_dict.get("library_usage", 5))

    vector = [att, gpa, internal, fails, fee_ratio, lib]

    # Model inference
    if MODEL is not None:
        try:
            pred_class = MODEL.predict([vector])[0]
            # Calculate probability of highest risk
            classes = list(MODEL.classes_)
            probs = MODEL.predict_proba([vector])[0]
            prob_map = dict(zip(classes, probs))
            risk_score = round(float(prob_map.get("HIGH", 0.0) + 0.5 * prob_map.get("MEDIUM", 0.0)), 2)
            risk_level = str(pred_class)
        except Exception:
            risk_level, risk_score = _rule_based_inference(vector)
    else:
        risk_level, risk_score = _rule_based_inference(vector)

    risk_factors = calculate_risk_factors(feature_dict)
    recommendations = generate_recommendations(risk_level, risk_factors)

    return {
        "predicted_risk_level": risk_level,
        "risk_score": risk_score,
        "risk_factors": risk_factors,
        "recommendations": recommendations,
        "input_features": {
            "attendance_percentage": att,
            "previous_gpa": gpa,
            "internal_marks_avg": internal,
            "failed_subjects": fails,
            "fee_outstanding_ratio": fee_ratio,
            "library_usage": lib
        }
    }


def _rule_based_inference(vector: list) -> tuple:
    """Analytical fallback heuristic."""
    att, gpa, internal, fails, fee_ratio, lib = vector
    score = 0.0
    if att < 60: score += 0.40
    elif att < 75: score += 0.20
    if fails >= 2: score += 0.35
    elif fails == 1: score += 0.18
    if gpa < 5.5: score += 0.30
    elif gpa < 6.5: score += 0.15
    if internal < 45: score += 0.20
    
    score = min(1.0, round(score, 2))
    if score >= 0.50:
        level = "HIGH"
    elif score >= 0.25:
        level = "MEDIUM"
    else:
        level = "LOW"
    return level, score


def simulate_what_if_scenario(baseline_features: dict, interventions: dict) -> dict:
    """
    Simulates academic risk impact under proposed target interventions.
    """
    # 1. Baseline prediction
    baseline_pred = predict_student_risk(baseline_features)

    # 2. Apply interventions
    simulated_features = baseline_features.copy()
    
    if "target_attendance" in interventions:
        simulated_features["attendance_percentage"] = float(interventions["target_attendance"])
    elif "attendance_delta" in interventions:
        simulated_features["attendance_percentage"] = min(100.0, float(baseline_features.get("attendance_percentage", 70.0)) + float(interventions["attendance_delta"]))

    if "remedial_score_boost" in interventions:
        boost = float(interventions["remedial_score_boost"])
        simulated_features["internal_marks_avg"] = min(100.0, float(baseline_features.get("internal_marks_avg", 60.0)) + boost)
        simulated_features["previous_gpa"] = min(10.0, float(baseline_features.get("previous_gpa", 6.0)) + (boost * 0.03))

    if "cleared_backlogs" in interventions:
        cleared = int(interventions["cleared_backlogs"])
        simulated_features["failed_subjects"] = max(0, int(baseline_features.get("failed_subjects", 0)) - cleared)

    if "target_library_books" in interventions:
        simulated_features["library_usage"] = int(interventions["target_library_books"])

    # 3. Simulated prediction
    simulated_pred = predict_student_risk(simulated_features)

    # Calculate risk delta
    base_score = baseline_pred["risk_score"]
    sim_score = simulated_pred["risk_score"]
    pct_reduction = round(((base_score - sim_score) / base_score * 100.0) if base_score > 0 else 0.0, 1)

    return {
        "disclaimer": "Scenario Simulation: Model-derived projection for institutional decision support; not a guaranteed outcome.",
        "baseline": {
            "attendance": baseline_features.get("attendance_percentage"),
            "gpa": baseline_features.get("previous_gpa"),
            "failed_subjects": baseline_features.get("failed_subjects"),
            "risk_level": baseline_pred["predicted_risk_level"],
            "risk_score": base_score,
            "risk_factors": baseline_pred["risk_factors"]
        },
        "simulated": {
            "attendance": simulated_features.get("attendance_percentage"),
            "gpa": simulated_features.get("previous_gpa"),
            "failed_subjects": simulated_features.get("failed_subjects"),
            "risk_level": simulated_pred["predicted_risk_level"],
            "risk_score": sim_score,
            "risk_factors": simulated_pred["risk_factors"]
        },
        "impact_summary": {
            "risk_score_delta": round(sim_score - base_score, 2),
            "percentage_risk_reduction": pct_reduction,
            "status_changed": (baseline_pred["predicted_risk_level"] != simulated_pred["predicted_risk_level"])
        }
    }


if __name__ == "__main__":
    sample_student = {
        "attendance_percentage": 58.0,
        "previous_gpa": 5.9,
        "internal_marks_avg": 42.0,
        "failed_subjects": 2,
        "fee_outstanding_ratio": 0.2,
        "library_usage": 2
    }
    print("Testing Risk Prediction:")
    res = predict_student_risk(sample_student)
    print(json.dumps(res, indent=2))

    print("\nTesting What-If Simulation (+20% attendance, clear 1 backlog):")
    sim = simulate_what_if_scenario(sample_student, {"target_attendance": 80.0, "cleared_backlogs": 1})
    print(json.dumps(sim, indent=2))
