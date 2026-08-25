"""
Authentication & Role-Based Access Route Blueprint
--------------------------------------------------
Provides secure token/session simulated authentication with role-based profiles
(ADMIN, FACULTY, STUDENT) for academic governance demonstration.
"""

from flask import Blueprint, request
import hashlib
from backend.utils.helpers import success_response, error_response

auth_bp = Blueprint("auth", __name__)

# Pre-configured demo credentials (passwords hashed with SHA256)
# Password for all demo accounts: 'demo1234'
DEMO_PASSWORD_HASH = hashlib.sha256("demo1234".encode()).hexdigest()

DEMO_USERS = {
    "admin@univ.edu": {
        "user_id": "USR_ADMIN_01",
        "email": "admin@univ.edu",
        "name": "Dr. Sarah Jenkins (Dean / Admin)",
        "role": "ADMIN",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["all", "data_quality", "risk_intervention", "etl_trigger"]
    },
    "faculty@univ.edu": {
        "user_id": "FAC101",
        "email": "faculty@univ.edu",
        "name": "Prof. Rajeshwar Rao (CSE HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_CSE",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "student@univ.edu": {
        "user_id": "STU2023001",
        "email": "student@univ.edu",
        "name": "Aarav Sharma (Student)",
        "role": "STUDENT",
        "student_id": "STU2023001",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    }
}


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticates user credentials and returns user profile session."""
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower()
    password = body.get("password", "").strip()

    if not email or not password:
        return error_response(message="Email and password are required", status_code=400)

    user = DEMO_USERS.get(email)
    if not user:
        return error_response(message="Invalid email or password", status_code=401)

    hashed_input = hashlib.sha256(password.encode()).hexdigest()
    if hashed_input != user["password_hash"]:
        return error_response(message="Invalid email or password", status_code=401)

    # Return sanitized user session
    session_data = {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "department_id": user.get("department_id"),
        "student_id": user.get("student_id"),
        "permissions": user["permissions"],
        "token": f"token-demo-{user['role'].lower()}-{user['user_id']}"
    }

    return success_response(data=session_data, message=f"Welcome {user['name']}")


@auth_bp.route("/auth/demo-accounts", methods=["GET"])
def get_demo_accounts():
    """Returns available demo accounts for easy evaluator login testing."""
    accounts = [
        {"role": u["role"], "email": u["email"], "password": "demo1234", "name": u["name"]}
        for u in DEMO_USERS.values()
    ]
    return success_response(data=accounts, message="Demo credentials available")
