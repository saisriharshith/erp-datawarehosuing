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
    # 1. ADMIN / EXECUTIVE ACCOUNTS (2)
    "admin@univ.edu": {
        "user_id": "USR_ADMIN_01",
        "email": "admin@univ.edu",
        "name": "Dr. Sarah Jenkins (Dean of Academic Affairs)",
        "role": "ADMIN",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["all", "data_quality", "risk_intervention", "etl_trigger"]
    },
    "provost@univ.edu": {
        "user_id": "USR_ADMIN_02",
        "email": "provost@univ.edu",
        "name": "Prof. Arthur Pendelton (University Provost)",
        "role": "ADMIN",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["all", "data_quality", "risk_intervention", "etl_trigger"]
    },

    # 2. FACULTY & DEPARTMENT HOD ACCOUNTS (8)
    "faculty@univ.edu": {
        "user_id": "FAC101",
        "email": "faculty@univ.edu",
        "name": "Prof. Rajeshwar Rao (CSE HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "cse.hod@univ.edu": {
        "user_id": "FAC101",
        "email": "cse.hod@univ.edu",
        "name": "Dr. R. Ramanujan (Professor & CSE HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "ece.hod@univ.edu": {
        "user_id": "FAC102",
        "email": "ece.hod@univ.edu",
        "name": "Dr. Meenakshi Sundaram (ECE HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_ECE",
        "department_name": "Electronics & Communication Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "mech.hod@univ.edu": {
        "user_id": "FAC103",
        "email": "mech.hod@univ.edu",
        "name": "Dr. K. Vikram (Mechanical HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_MECH",
        "department_name": "Mechanical Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "civil.hod@univ.edu": {
        "user_id": "FAC104",
        "email": "civil.hod@univ.edu",
        "name": "Dr. S. Ananth (Civil HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_CIVIL",
        "department_name": "Civil Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "aids.hod@univ.edu": {
        "user_id": "FAC105",
        "email": "aids.hod@univ.edu",
        "name": "Dr. Priya Venkatesh (AI & Data Science HOD)",
        "role": "FACULTY",
        "department_id": "DEPT_AIDS",
        "department_name": "Artificial Intelligence & Data Science",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "prof.sharma@univ.edu": {
        "user_id": "FAC106",
        "email": "prof.sharma@univ.edu",
        "name": "Prof. Amit Sharma (Associate Professor, CSE)",
        "role": "FACULTY",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },
    "prof.reddy@univ.edu": {
        "user_id": "FAC107",
        "email": "prof.reddy@univ.edu",
        "name": "Prof. Kavitha Reddy (Assistant Professor, ECE)",
        "role": "FACULTY",
        "department_id": "DEPT_ECE",
        "department_name": "Electronics & Communication Engineering",
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["department_analytics", "student_intervention"]
    },

    # 3. STUDENT ACCOUNTS ACROSS DEPARTMENTS (10)
    "student@univ.edu": {
        "user_id": "STU20210001",
        "email": "student@univ.edu",
        "name": "Aarav Sharma (CSE Student)",
        "role": "STUDENT",
        "student_id": "STU20210001",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "semester": 5,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "aarav@univ.edu": {
        "user_id": "STU20210001",
        "email": "aarav@univ.edu",
        "name": "Aarav Sharma (CSE Student)",
        "role": "STUDENT",
        "student_id": "STU20210001",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "semester": 5,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "sneha@univ.edu": {
        "user_id": "STU20220013",
        "email": "sneha@univ.edu",
        "name": "Sneha Verma (CSE Freshman)",
        "role": "STUDENT",
        "student_id": "STU20220013",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "semester": 2,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "vikram@univ.edu": {
        "user_id": "STU20230014",
        "email": "vikram@univ.edu",
        "name": "Vikram Gupta (AI&DS Senior)",
        "role": "STUDENT",
        "student_id": "STU20230014",
        "department_id": "DEPT_AIDS",
        "department_name": "Artificial Intelligence & Data Science",
        "semester": 8,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "ananya@univ.edu": {
        "user_id": "STU20240015",
        "email": "ananya@univ.edu",
        "name": "Ananya Iyer (ECE Merit Scholar)",
        "role": "STUDENT",
        "student_id": "STU20240015",
        "department_id": "DEPT_ECE",
        "department_name": "Electronics & Communication Engineering",
        "semester": 4,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "rohan@univ.edu": {
        "user_id": "STU20210016",
        "email": "rohan@univ.edu",
        "name": "Rohan Verma (MECH Shortage Alert)",
        "role": "STUDENT",
        "student_id": "STU20210016",
        "department_id": "DEPT_MECH",
        "department_name": "Mechanical Engineering",
        "semester": 3,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "priya.patel@univ.edu": {
        "user_id": "STU20220017",
        "email": "priya.patel@univ.edu",
        "name": "Priya Patel (CIVIL Student)",
        "role": "STUDENT",
        "student_id": "STU20220017",
        "department_id": "DEPT_CIVIL",
        "department_name": "Civil Engineering",
        "semester": 6,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "karthik@univ.edu": {
        "user_id": "STU20230018",
        "email": "karthik@univ.edu",
        "name": "Karthik Nair (CSE Final Year)",
        "role": "STUDENT",
        "student_id": "STU20230018",
        "department_id": "DEPT_CSE",
        "department_name": "Computer Science & Engineering",
        "semester": 7,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "pooja@univ.edu": {
        "user_id": "STU20240019",
        "email": "pooja@univ.edu",
        "name": "Pooja Joshi (AI&DS Freshman)",
        "role": "STUDENT",
        "student_id": "STU20240019",
        "department_id": "DEPT_AIDS",
        "department_name": "Artificial Intelligence & Data Science",
        "semester": 1,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "rahul@univ.edu": {
        "user_id": "STU20210020",
        "email": "rahul@univ.edu",
        "name": "Rahul Deshmukh (ECE Student)",
        "role": "STUDENT",
        "student_id": "STU20210020",
        "department_id": "DEPT_ECE",
        "department_name": "Electronics & Communication Engineering",
        "semester": 5,
        "password_hash": DEMO_PASSWORD_HASH,
        "permissions": ["view_own_profile"]
    },
    "divya@univ.edu": {
        "user_id": "STU20220021",
        "email": "divya@univ.edu",
        "name": "Divya Sundaram (MECH Honors)",
        "role": "STUDENT",
        "student_id": "STU20220021",
        "department_id": "DEPT_MECH",
        "department_name": "Mechanical Engineering",
        "semester": 6,
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
