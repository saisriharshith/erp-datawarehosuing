"""
Student Profile & 360-Degree Analytics Service
----------------------------------------------
Provides paginated student directories, multi-parameter search, and comprehensive
360-degree academic profile consolidation.
"""

from typing import Optional, Dict, Any, List
from backend.extensions import db_manager


class StudentService:
    """Consolidated student services."""

    @staticmethod
    def get_students(
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        dept_id: Optional[str] = None,
        semester: Optional[int] = None,
        risk_level: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetches paginated list of students with analytical summaries."""
        students = db_manager.get_collection_data("dim_students")
        attendance = db_manager.get_collection_data("fact_attendance")
        exams = db_manager.get_collection_data("fact_examinations")
        fees = db_manager.get_collection_data("fact_fees")
        predictions = db_manager.get_collection_data("risk_predictions")

        # Create quick lookup indices
        att_map = {}
        for a in attendance:
            att_map.setdefault(a["student_id"], []).append(a.get("attendance_percentage", 0))

        exam_map = {}
        for e in exams:
            exam_map.setdefault(e["student_id"], []).append(e.get("grade_point", 0))

        fee_map = {}
        for f in fees:
            # Latest fee status
            fee_map[f["student_id"]] = f.get("status", "PAID")

        risk_map = {p["student_id"]: p for p in predictions}

        enriched_students = []
        for s in students:
            s_id = s["student_id"]
            
            # Avg attendance
            att_list = att_map.get(s_id, [75.0])
            avg_att = round(sum(att_list) / len(att_list), 1) if att_list else 75.0

            # CGPA
            gpa_list = exam_map.get(s_id, [7.5])
            cgpa = round(sum(gpa_list) / len(gpa_list), 2) if gpa_list else 7.5

            fee_st = fee_map.get(s_id, "PAID")
            risk_info = risk_map.get(s_id, {})
            r_level = risk_info.get("risk_level", "LOW")
            r_score = risk_info.get("risk_score", 0.15)

            # Apply filters
            if dept_id and s.get("department_id") != dept_id:
                continue
            if semester and s.get("current_semester") != semester:
                continue
            if risk_level and r_level != risk_level:
                continue
            if search:
                query = search.lower().strip()
                name_match = query in s.get("full_name", "").lower()
                id_match = query in s_id.lower()
                if not (name_match or id_match):
                    continue

            enriched_students.append({
                "student_id": s_id,
                "full_name": s.get("full_name"),
                "email": s.get("email"),
                "department_id": s.get("department_id"),
                "department_name": s.get("department_name"),
                "semester": s.get("current_semester"),
                "batch_year": s.get("batch_year"),
                "admission_quota": s.get("admission_quota"),
                "attendance_percentage": avg_att,
                "cgpa": cgpa,
                "fee_status": fee_st,
                "risk_level": r_level,
                "risk_score": r_score
            })

        total = len(enriched_students)
        total_pages = max(1, (total + limit - 1) // limit)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "students": enriched_students[start_idx:end_idx]
        }

    @staticmethod
    def get_student_profile(student_id: str) -> Optional[Dict[str, Any]]:
        """Consolidates complete 360-degree profile for a single student."""
        students = db_manager.get_collection_data("dim_students")
        student = next((s for s in students if s["student_id"] == student_id), None)
        if not student:
            return None

        attendance = [a for a in db_manager.get_collection_data("fact_attendance") if a["student_id"] == student_id]
        exams = [e for e in db_manager.get_collection_data("fact_examinations") if e["student_id"] == student_id]
        fees = [f for f in db_manager.get_collection_data("fact_fees") if f["student_id"] == student_id]
        library = next((l for l in db_manager.get_collection_data("fact_library") if l["student_id"] == student_id), None)
        risk = next((p for p in db_manager.get_collection_data("risk_predictions") if p["student_id"] == student_id), None)

        # 1. Attendance Summary
        att_pcts = [a.get("attendance_percentage", 0) for a in attendance]
        total_classes = sum(a.get("total_classes", 0) for a in attendance)
        classes_attended = sum(a.get("classes_attended", 0) for a in attendance)
        avg_att = round(sum(att_pcts) / len(att_pcts), 1) if att_pcts else 0

        # 2. Exam Summary
        gpas = [e.get("grade_point", 0) for e in exams]
        cgpa = round(sum(gpas) / len(gpas), 2) if gpas else 0
        backlogs = sum(1 for e in exams if not e.get("is_passed", True))

        # 3. Fees Summary
        total_due = sum(f.get("total_due", 0) for f in fees)
        total_paid = sum(f.get("total_paid", 0) for f in fees)
        outstanding = sum(f.get("outstanding_balance", 0) for f in fees)
        fee_status = "PAID" if outstanding == 0 else ("PARTIAL" if total_paid > 0 else "OVERDUE")

        # 4. Risk Profile
        if not risk:
            from ml.predict import predict_student_risk
            risk_input = {
                "attendance_percentage": avg_att,
                "previous_gpa": cgpa,
                "internal_marks_avg": 70.0,
                "failed_subjects": backlogs,
                "fee_outstanding_ratio": (outstanding / total_due) if total_due > 0 else 0.0,
                "library_usage": library.get("total_books_borrowed", 5) if library else 5
            }
            pred_res = predict_student_risk(risk_input)
            risk = {
                "risk_level": pred_res["predicted_risk_level"],
                "risk_score": pred_res["risk_score"],
                "risk_factors": pred_res["risk_factors"]
            }

        return {
            "student": student,
            "attendance": {
                "overall_percentage": avg_att,
                "total_classes": total_classes,
                "classes_attended": classes_attended,
                "subject_records": attendance
            },
            "examinations": {
                "cgpa": cgpa,
                "backlogs": backlogs,
                "total_exams_taken": len(exams),
                "exam_records": exams
            },
            "fees": {
                "total_due": total_due,
                "total_paid": total_paid,
                "outstanding_balance": outstanding,
                "status": fee_status,
                "transaction_records": fees
            },
            "library": library if library else {
                "total_books_borrowed": 0,
                "overdue_instances": 0,
                "total_fine_paid": 0,
                "unpaid_fines": 0
            },
            "risk_assessment": {
                "risk_level": risk.get("risk_level", "LOW"),
                "risk_score": risk.get("risk_score", 0.15),
                "risk_factors": risk.get("risk_factors", ["Satisfactory academic standing"])
            }
        }
