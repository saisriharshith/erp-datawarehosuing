"""
Students Route Blueprint
------------------------
Serves student directory, search, pagination, and full 360 profiles.
"""

from flask import Blueprint, request
from backend.services.student_service import StudentService
from backend.utils.helpers import success_response, error_response

students_bp = Blueprint("students", __name__)


@students_bp.route("/students", methods=["GET"])
def get_students():
    """Paginated student list with search and filters."""
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    search = request.args.get("search")
    dept_id = request.args.get("department_id")
    sem_raw = request.args.get("semester")
    semester = int(sem_raw) if sem_raw and sem_raw.isdigit() else None
    risk_level = request.args.get("risk_level")

    data = StudentService.get_students(
        page=page,
        limit=limit,
        search=search,
        dept_id=dept_id,
        semester=semester,
        risk_level=risk_level
    )
    return success_response(data=data, message="Students fetched successfully")


@students_bp.route("/students/<student_id>", methods=["GET"])
def get_student_detail(student_id):
    """360-degree academic profile for a single student."""
    data = StudentService.get_student_profile(student_id.strip().upper())
    if not data:
        return error_response(message=f"Student with ID '{student_id}' not found", status_code=404)
    return success_response(data=data, message="Student 360 profile fetched successfully")


@students_bp.route("/student/portal-summary", methods=["GET"])
def get_student_portal():
    """Personalized student portal data for the logged-in student."""
    student_id = request.args.get("student_id", "STU2023001").strip().upper()
    data = StudentService.get_student_portal_data(student_id)
    if not data:
        return error_response(message=f"Student record '{student_id}' not found", status_code=404)
    return success_response(data=data, message="Personal student portal data fetched successfully")
