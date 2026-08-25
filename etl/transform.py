"""
ETL Transform Module
--------------------
Cleanses, normalizes, deduplicates, and reshapes raw operational ERP records into
star-schema analytical dimensions and facts.
"""

import re
from datetime import datetime
from typing import Dict, List, Any, Tuple


# Canonical Department Normalization Mapping
DEPT_NORMALIZATION_MAP = {
    "computer science": "DEPT_CSE",
    "cse": "DEPT_CSE",
    "comp sci": "DEPT_CSE",
    "cs": "DEPT_CSE",
    "computer science & engg": "DEPT_CSE",
    "cs-eng": "DEPT_CSE",
    "dept_cse": "DEPT_CSE",

    "electronics": "DEPT_ECE",
    "electronics & comm": "DEPT_ECE",
    "ece": "DEPT_ECE",
    "e&ce": "DEPT_ECE",
    "ece dept": "DEPT_ECE",
    "dept_ece": "DEPT_ECE",

    "mechanical": "DEPT_MECH",
    "mech": "DEPT_MECH",
    "mechanical engg": "DEPT_MECH",
    "mech dept": "DEPT_MECH",
    "dept_mech": "DEPT_MECH",

    "civil": "DEPT_CIVIL",
    "civil engg": "DEPT_CIVIL",
    "civil dept": "DEPT_CIVIL",
    "dept_civil": "DEPT_CIVIL",

    "ai & ds": "DEPT_AIDS",
    "aids": "DEPT_AIDS",
    "ai-ds": "DEPT_AIDS",
    "data science": "DEPT_AIDS",
    "artificial intelligence": "DEPT_AIDS",
    "dept_aids": "DEPT_AIDS"
}

DEPT_METADATA = {
    "DEPT_CSE": {"name": "Computer Science & Engineering", "short": "CSE"},
    "DEPT_ECE": {"name": "Electronics & Communication Engineering", "short": "ECE"},
    "DEPT_MECH": {"name": "Mechanical Engineering", "short": "MECH"},
    "DEPT_CIVIL": {"name": "Civil Engineering", "short": "CIVIL"},
    "DEPT_AIDS": {"name": "Artificial Intelligence & Data Science", "short": "AI&DS"}
}


def normalize_department(dept_str: Any) -> Tuple[str, str]:
    """Normalizes any department string or synonym to canonical (dept_id, dept_name)."""
    if not dept_str or not isinstance(dept_str, str):
        return "DEPT_CSE", DEPT_METADATA["DEPT_CSE"]["name"]
    
    clean_key = dept_str.strip().lower()
    dept_id = DEPT_NORMALIZATION_MAP.get(clean_key, "DEPT_CSE")
    dept_name = DEPT_METADATA[dept_id]["name"]
    return dept_id, dept_name


def parse_and_standardize_date(date_val: Any) -> str:
    """Parses varied date formats into standard ISO YYYY-MM-DD string."""
    if not date_val:
        return "2024-01-01"
    
    if isinstance(date_val, datetime):
        return date_val.strftime("%Y-%m-%d")
    
    date_str = str(date_val).strip()
    
    # Try ISO YYYY-MM-DD
    iso_match = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})", date_str)
    if iso_match:
        y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
        try:
            return f"{y:04d}-{m:02d}-{d:02d}"
        except ValueError:
            pass

    # Try DD/MM/YYYY or DD-MM-YYYY
    dmy_match = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})", date_str)
    if dmy_match:
        d, m, y = int(dmy_match.group(1)), int(dmy_match.group(2)), int(dmy_match.group(3))
        # Disambiguate if m > 12 -> it was mm-dd-yyyy
        if m > 12 and d <= 12:
            m, d = d, m
        try:
            return f"{y:04d}-{m:02d}-{d:02d}"
        except ValueError:
            pass

    return "2024-01-01"


def calculate_grade_points(total_marks: float) -> Tuple[float, str, bool]:
    """Calculates grade point, letter, and pass status based on 10-point scale."""
    if total_marks >= 90:
        return 10.0, "O", True
    elif total_marks >= 80:
        return 9.0, "A+", True
    elif total_marks >= 70:
        return 8.0, "A", True
    elif total_marks >= 60:
        return 7.0, "B+", True
    elif total_marks >= 50:
        return 6.0, "B", True
    elif total_marks >= 40:
        return 5.0, "C", True
    else:
        return 0.0, "F", False


def transform_data(raw_data: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Transforms raw extracted ERP collections into dimensional star schema.
    Returns cleaned dimensions, facts, and transformation execution metrics.
    """
    print("[ETL-TRANSFORM] Starting data transformation and schema standardization...")
    sanitized_issues = []
    
    # 1. Transform dim_departments
    dim_departments = []
    for d in raw_data.get("departments", []):
        dept_id, dept_name = normalize_department(d.get("code") or d.get("dept_name"))
        dim_departments.append({
            "_id": dept_id,
            "department_id": dept_id,
            "department_name": dept_name,
            "short_code": DEPT_METADATA[dept_id]["short"],
            "hod_name": d.get("hod_incharge", "Faculty In-Charge"),
            "intake_capacity": int(d.get("intake_capacity", 120)),
            "established_year": int(d.get("est_year", 2005))
        })
    # Fallback default if empty
    if not dim_departments:
        for d_id, meta in DEPT_METADATA.items():
            dim_departments.append({
                "_id": d_id,
                "department_id": d_id,
                "department_name": meta["name"],
                "short_code": meta["short"],
                "hod_name": "Head of Department",
                "intake_capacity": 120,
                "established_year": 2005
            })

    # 2. Transform dim_subjects
    dim_subjects = []
    for s in raw_data.get("subjects", []):
        dept_id, _ = normalize_department(s.get("dept_code"))
        sub_code = str(s.get("sub_code")).strip().upper()
        dim_subjects.append({
            "_id": sub_code,
            "subject_id": sub_code,
            "subject_name": s.get("title", "Core Engineering Subject"),
            "department_id": dept_id,
            "semester": int(s.get("semester", 1)),
            "credits": int(s.get("credits", 3)),
            "is_elective": False
        })

    # 3. Transform dim_faculty
    dim_faculty = []
    for f in raw_data.get("faculty", []):
        dept_id, dept_name = normalize_department(f.get("assigned_dept"))
        fac_id = str(f.get("fac_id")).strip()
        dim_faculty.append({
            "_id": fac_id,
            "faculty_id": fac_id,
            "faculty_name": f.get("faculty_name"),
            "department_id": dept_id,
            "department_name": dept_name,
            "designation": f.get("designation", "Assistant Professor"),
            "experience_years": int(f.get("experience_years", 5)),
            "email": f.get("email"),
            "workload_hours_per_week": int(f.get("workload_hours_per_week", 16))
        })

    # 4. Transform dim_students (with deduplication & email/name normalization)
    dim_students = []
    seen_student_ids = set()
    raw_students = raw_data.get("students", [])
    
    # Admissions map for quota and merit rank lookup
    admissions_map = {}
    for adm in raw_data.get("admissions", []):
        s_id = adm.get("student_id")
        if s_id:
            admissions_map[s_id] = adm

    duplicates_removed_count = 0

    for st in raw_students:
        s_id = str(st.get("raw_student_id")).strip().upper()
        if s_id in seen_student_ids:
            duplicates_removed_count += 1
            continue
        seen_student_ids.add(s_id)

        dept_id, dept_name = normalize_department(st.get("department"))
        fname = str(st.get("first_name", "Student")).strip().title()
        lname = str(st.get("last_name", "")).strip().title()
        email = st.get("contact_email")
        if not email or "@" not in email:
            email = f"{fname.lower()}.{lname.lower()}@univ.edu"
            sanitized_issues.append({"table": "students", "issue": f"Missing email imputed for {s_id}", "action": "Imputed"})

        adm_info = admissions_map.get(s_id, {})
        quota = adm_info.get("quota_category", "Merit")
        merit_rank = adm_info.get("merit_rank", 15000)

        dim_students.append({
            "_id": s_id,
            "student_id": s_id,
            "first_name": fname,
            "last_name": lname,
            "full_name": f"{fname} {lname}".strip(),
            "gender": st.get("gender", "Unspecified"),
            "date_of_birth": parse_and_standardize_date(st.get("date_of_birth")),
            "email": email,
            "phone": st.get("contact_phone", "N/A"),
            "department_id": dept_id,
            "department_name": dept_name,
            "batch_year": int(st.get("admission_batch", 2023)),
            "current_semester": int(st.get("current_sem", 5)),
            "admission_quota": quota,
            "merit_rank": merit_rank,
            "is_active": True,
            "created_at": datetime.now().isoformat()
        })

    if duplicates_removed_count > 0:
        sanitized_issues.append({
            "table": "students",
            "issue": f"{duplicates_removed_count} duplicate student records detected",
            "action": "Deduplicated"
        })

    # 5. Transform dim_dates
    dim_dates = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for y in [2021, 2022, 2023, 2024, 2025]:
        for m_idx, m_name in enumerate(months, 1):
            date_key = f"{y}-{m_idx:02d}-01"
            term = "ODD" if m_idx in [7, 8, 9, 10, 11, 12] else "EVEN"
            quarter = f"Q{(m_idx-1)//3 + 1}"
            acad_year = f"{y}-{y+1}" if m_idx >= 7 else f"{y-1}-{y}"
            dim_dates.append({
                "_id": date_key,
                "date_key": date_key,
                "academic_year": acad_year,
                "semester_term": term,
                "month_num": m_idx,
                "month_name": m_name,
                "quarter": quarter,
                "year": y
            })

    # 6. Transform fact_attendance (Clamping out-of-range values, status categorization)
    fact_attendance = []
    seen_att_keys = set()
    att_anomalies_count = 0

    for att in raw_data.get("attendance", []):
        s_id = str(att.get("student_id")).strip().upper()
        if s_id not in seen_student_ids:
            continue  # Ignore records referencing non-existent students
        
        sub_code = str(att.get("subject_code")).strip().upper()
        sem = int(att.get("semester", 1))
        acad_year = att.get("academic_year", "2024-2025")
        
        total_conducted = int(att.get("total_conducted", 60))
        attended_count = int(att.get("attended_count", 45))

        # Data Cleansing: Clamp values to realistic boundaries
        if attended_count > total_conducted:
            att_anomalies_count += 1
            attended_count = total_conducted
        elif attended_count < 0:
            att_anomalies_count += 1
            attended_count = 0

        att_pct = round((attended_count / total_conducted * 100.0) if total_conducted > 0 else 0.0, 2)
        
        # Categorical attendance status
        if att_pct >= 75.0:
            status = "Adequate"
        elif att_pct >= 60.0:
            status = "Shortage"
        else:
            status = "Critical"

        dept_id, _ = normalize_department(att.get("dept_id"))
        unique_key = f"{s_id}_{sub_code}_{sem}_{acad_year}"
        if unique_key in seen_att_keys:
            continue
        seen_att_keys.add(unique_key)

        fact_attendance.append({
            "_id": f"ATT_{unique_key}",
            "attendance_id": f"ATT_{unique_key}",
            "student_id": s_id,
            "department_id": dept_id,
            "subject_id": sub_code,
            "semester": sem,
            "academic_year": acad_year,
            "total_classes": total_conducted,
            "classes_attended": attended_count,
            "attendance_percentage": att_pct,
            "status": status,
            "recorded_date": parse_and_standardize_date(att.get("last_recorded_date"))
        })

    if att_anomalies_count > 0:
        sanitized_issues.append({
            "table": "attendance",
            "issue": f"{att_anomalies_count} records had invalid attendance counts (< 0 or > total)",
            "action": "Clamped to valid [0, total_classes] interval"
        })

    # 7. Transform fact_examinations (Marks range normalization, grade points calculation)
    fact_examinations = []
    seen_exam_keys = set()
    exam_anomalies_count = 0

    for ex in raw_data.get("examinations", []):
        s_id = str(ex.get("student_id")).strip().upper()
        if s_id not in seen_student_ids:
            continue

        sub_code = str(ex.get("subject_code")).strip().upper()
        sem = int(ex.get("semester", 1))
        acad_year = ex.get("academic_year", "2024-2025")
        dept_id, _ = normalize_department(ex.get("dept_code"))

        internal = float(ex.get("internal_marks_scored", 20))
        endsem = float(ex.get("end_semester_marks_scored", 50))

        # Cleansing: Clamp marks
        if internal < 0 or internal > 30:
            exam_anomalies_count += 1
            internal = max(0.0, min(30.0, internal))
        if endsem < 0 or endsem > 70:
            exam_anomalies_count += 1
            endsem = max(0.0, min(70.0, endsem))

        total_marks = round(internal + endsem, 1)
        grade_point, grade_letter, is_passed = calculate_grade_points(total_marks)

        unique_key = f"{s_id}_{sub_code}_{sem}_{acad_year}"
        if unique_key in seen_exam_keys:
            continue
        seen_exam_keys.add(unique_key)

        fact_examinations.append({
            "_id": f"EXM_{unique_key}",
            "exam_id": f"EXM_{unique_key}",
            "student_id": s_id,
            "department_id": dept_id,
            "subject_id": sub_code,
            "semester": sem,
            "academic_year": acad_year,
            "internal_marks": internal,
            "internal_max": 30,
            "end_sem_marks": endsem,
            "end_sem_max": 70,
            "total_marks": total_marks,
            "total_max": 100,
            "grade_point": grade_point,
            "grade_letter": grade_letter,
            "is_passed": is_passed
        })

    if exam_anomalies_count > 0:
        sanitized_issues.append({
            "table": "examinations",
            "issue": f"{exam_anomalies_count} examination scores had out-of-range marks",
            "action": "Sanitized and clamped to [0, max] scale"
        })

    # 8. Transform fact_fees (Deduplication, outstanding calculation, status normalization)
    fact_fees = []
    seen_fee_keys = set()
    fee_duplicates_count = 0

    for fee in raw_data.get("fees", []):
        s_id = str(fee.get("student_id")).strip().upper()
        if s_id not in seen_student_ids:
            continue
        
        sem = int(fee.get("semester", 1))
        acad_year = fee.get("academic_year", "2024-2025")
        unique_fee_key = f"{s_id}_SEM{sem}_{acad_year}"
        
        if unique_fee_key in seen_fee_keys:
            fee_duplicates_count += 1
            continue
        seen_fee_keys.add(unique_fee_key)

        due = float(fee.get("total_due_amount", 75000))
        paid = float(fee.get("amount_paid", 75000))
        outstanding = max(0.0, round(due - paid, 2))

        status = "PAID" if outstanding == 0 else ("PARTIAL" if paid > 0 else "OVERDUE")

        fact_fees.append({
            "_id": f"FEE_{unique_fee_key}",
            "fee_id": f"FEE_{unique_fee_key}",
            "student_id": s_id,
            "semester": sem,
            "academic_year": acad_year,
            "total_due": due,
            "total_paid": paid,
            "outstanding_balance": outstanding,
            "status": status,
            "payment_mode": fee.get("payment_mode", "NetBanking"),
            "transaction_date": parse_and_standardize_date(fee.get("transaction_date"))
        })

    if fee_duplicates_count > 0:
        sanitized_issues.append({
            "table": "fees",
            "issue": f"{fee_duplicates_count} duplicate fee records detected",
            "action": "Consolidated & Deduplicated"
        })

    # 9. Transform fact_library (Aggregated per student per academic year)
    fact_library = []
    lib_by_student_year = {}

    for lib in raw_data.get("library", []):
        s_id = str(lib.get("student_id")).strip().upper()
        if s_id not in seen_student_ids:
            continue

        acad_year = "2024-2025"
        key = f"{s_id}_{acad_year}"
        if key not in lib_by_student_year:
            lib_by_student_year[key] = {
                "student_id": s_id,
                "academic_year": acad_year,
                "total_books_borrowed": 0,
                "overdue_instances": 0,
                "total_fine_charged": 0.0,
                "total_fine_paid": 0.0
            }

        lib_by_student_year[key]["total_books_borrowed"] += 1
        if lib.get("is_overdue"):
            lib_by_student_year[key]["overdue_instances"] += 1
        lib_by_student_year[key]["total_fine_charged"] += float(lib.get("fine_charged", 0))
        lib_by_student_year[key]["total_fine_paid"] += float(lib.get("fine_paid", 0))

    for key, val in lib_by_student_year.items():
        fact_library.append({
            "_id": f"LIB_{key}",
            "student_id": val["student_id"],
            "academic_year": val["academic_year"],
            "total_books_borrowed": val["total_books_borrowed"],
            "overdue_instances": val["overdue_instances"],
            "total_fine_charged": val["total_fine_charged"],
            "total_fine_paid": val["total_fine_paid"],
            "unpaid_fines": max(0.0, val["total_fine_charged"] - val["total_fine_paid"])
        })

    print(f"[ETL-TRANSFORM] Transformation complete:")
    print(f"  • dim_departments: {len(dim_departments)}")
    print(f"  • dim_subjects:    {len(dim_subjects)}")
    print(f"  • dim_faculty:     {len(dim_faculty)}")
    print(f"  • dim_students:    {len(dim_students)} (Deduplicated)")
    print(f"  • dim_dates:       {len(dim_dates)}")
    print(f"  • fact_attendance: {len(fact_attendance)}")
    print(f"  • fact_examinations: {len(fact_examinations)}")
    print(f"  • fact_fees:       {len(fact_fees)}")
    print(f"  • fact_library:    {len(fact_library)}")

    return {
        "dimensions": {
            "dim_departments": dim_departments,
            "dim_subjects": dim_subjects,
            "dim_faculty": dim_faculty,
            "dim_students": dim_students,
            "dim_dates": dim_dates
        },
        "facts": {
            "fact_attendance": fact_attendance,
            "fact_examinations": fact_examinations,
            "fact_fees": fact_fees,
            "fact_library": fact_library
        },
        "sanitized_issues": sanitized_issues
    }
