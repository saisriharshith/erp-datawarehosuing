"""
ETL Validation & Data Quality System
------------------------------------
Executes comprehensive data quality validation across 5 enterprise DQ dimensions:
1. Completeness
2. Validity
3. Consistency
4. Uniqueness
5. Referential Integrity

Generates structured Data Quality Audit Reports for institutional governance.
"""

from datetime import datetime
from typing import Dict, List, Any


def validate_data_quality(
    raw_data: Dict[str, List[Dict[str, Any]]],
    transformed_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates data quality across 5 dimensions and computes audit scores.
    """
    print("[ETL-VALIDATE] Executing 5-Dimension Data Quality Assessment...")

    dims = transformed_data["dimensions"]
    facts = transformed_data["facts"]
    sanitized_issues = transformed_data.get("sanitized_issues", [])

    # -------------------------------------------------------------
    # 1. COMPLETENESS EVALUATION
    # -------------------------------------------------------------
    total_fields_checked = 0
    non_null_fields = 0

    # Check dim_students
    for s in dims["dim_students"]:
        fields = ["student_id", "first_name", "last_name", "department_id", "email", "date_of_birth", "current_semester"]
        for f in fields:
            total_fields_checked += 1
            if s.get(f) is not None and str(s.get(f)).strip() != "":
                non_null_fields += 1

    # Check fact_attendance
    for a in facts["fact_attendance"]:
        fields = ["attendance_id", "student_id", "subject_id", "attendance_percentage", "status"]
        for f in fields:
            total_fields_checked += 1
            if a.get(f) is not None:
                non_null_fields += 1

    # Check fact_examinations
    for e in facts["fact_examinations"]:
        fields = ["exam_id", "student_id", "subject_id", "total_marks", "grade_point"]
        for f in fields:
            total_fields_checked += 1
            if e.get(f) is not None:
                non_null_fields += 1

    # Check fact_fees
    for fee in facts["fact_fees"]:
        fields = ["fee_id", "student_id", "total_due", "total_paid", "status"]
        for f in fields:
            total_fields_checked += 1
            if fee.get(f) is not None:
                non_null_fields += 1

    completeness_score = round((non_null_fields / total_fields_checked * 100.0) if total_fields_checked > 0 else 100.0, 2)

    # -------------------------------------------------------------
    # 2. VALIDITY EVALUATION
    # -------------------------------------------------------------
    validity_checks_passed = 0
    validity_total_checks = 0

    # Validate attendance percentages (0 <= pct <= 100)
    for a in facts["fact_attendance"]:
        validity_total_checks += 1
        pct = a.get("attendance_percentage", 0)
        if 0.0 <= pct <= 100.0:
            validity_checks_passed += 1

    # Validate exam marks (0 <= total <= 100, 0 <= internal <= 30, 0 <= end_sem <= 70)
    for e in facts["fact_examinations"]:
        validity_total_checks += 1
        im = e.get("internal_marks", 0)
        em = e.get("end_sem_marks", 0)
        tm = e.get("total_marks", 0)
        if 0.0 <= im <= 30.0 and 0.0 <= em <= 70.0 and 0.0 <= tm <= 100.0:
            validity_checks_passed += 1

    # Validate student semester ranges (1 <= sem <= 8)
    for s in dims["dim_students"]:
        validity_total_checks += 1
        sem = s.get("current_semester", 1)
        if 1 <= sem <= 8:
            validity_checks_passed += 1

    # Validate fee balances (outstanding >= 0)
    for fee in facts["fact_fees"]:
        validity_total_checks += 1
        if fee.get("outstanding_balance", 0) >= 0:
            validity_checks_passed += 1

    validity_score = round((validity_checks_passed / validity_total_checks * 100.0) if validity_total_checks > 0 else 100.0, 2)

    # -------------------------------------------------------------
    # 3. CONSISTENCY EVALUATION
    # -------------------------------------------------------------
    consistency_checks_passed = 0
    consistency_total_checks = 0

    # Cross-check: Exam total_marks == internal_marks + end_sem_marks
    for e in facts["fact_examinations"]:
        consistency_total_checks += 1
        im = e.get("internal_marks", 0)
        em = e.get("end_sem_marks", 0)
        tm = e.get("total_marks", 0)
        if abs(tm - (im + em)) < 0.01:
            consistency_checks_passed += 1

    # Cross-check: Fee total_due == total_paid + outstanding_balance
    for fee in facts["fact_fees"]:
        consistency_total_checks += 1
        due = fee.get("total_due", 0)
        paid = fee.get("total_paid", 0)
        out = fee.get("outstanding_balance", 0)
        if abs(due - (paid + out)) < 0.01:
            consistency_checks_passed += 1

    # Cross-check: Attendance classes_attended <= total_classes
    for a in facts["fact_attendance"]:
        consistency_total_checks += 1
        if a.get("classes_attended", 0) <= a.get("total_classes", 1):
            consistency_checks_passed += 1

    consistency_score = round((consistency_checks_passed / consistency_total_checks * 100.0) if consistency_total_checks > 0 else 100.0, 2)

    # -------------------------------------------------------------
    # 4. UNIQUENESS EVALUATION
    # -------------------------------------------------------------
    raw_student_count = len(raw_data.get("students", []))
    clean_student_count = len(dims["dim_students"])
    duplicate_raw_students = max(0, raw_student_count - clean_student_count)

    raw_fee_count = len(raw_data.get("fees", []))
    clean_fee_count = len(facts["fact_fees"])
    duplicate_raw_fees = max(0, raw_fee_count - clean_fee_count)

    total_primary_entities = raw_student_count + raw_fee_count
    unique_entities = clean_student_count + clean_fee_count

    uniqueness_score = round((unique_entities / total_primary_entities * 100.0) if total_primary_entities > 0 else 100.0, 2)

    # -------------------------------------------------------------
    # 5. REFERENTIAL INTEGRITY EVALUATION
    # -------------------------------------------------------------
    valid_student_ids = {s["student_id"] for s in dims["dim_students"]}
    valid_dept_ids = {d["department_id"] for d in dims["dim_departments"]}
    valid_sub_ids = {sub["subject_id"] for sub in dims["dim_subjects"]}

    ref_checks_passed = 0
    ref_total_checks = 0

    # Fact attendance foreign keys
    for a in facts["fact_attendance"]:
        ref_total_checks += 2
        if a["student_id"] in valid_student_ids:
            ref_checks_passed += 1
        if a["department_id"] in valid_dept_ids:
            ref_checks_passed += 1

    # Fact examinations foreign keys
    for e in facts["fact_examinations"]:
        ref_total_checks += 2
        if e["student_id"] in valid_student_ids:
            ref_checks_passed += 1
        if e["subject_id"] in valid_sub_ids:
            ref_checks_passed += 1

    # Fact fees foreign keys
    for fee in facts["fact_fees"]:
        ref_total_checks += 1
        if fee["student_id"] in valid_student_ids:
            ref_checks_passed += 1

    ref_integrity_score = round((ref_checks_passed / ref_total_checks * 100.0) if ref_total_checks > 0 else 100.0, 2)

    # -------------------------------------------------------------
    # OVERALL COMPOSITE DATA QUALITY SCORE
    # -------------------------------------------------------------
    overall_score = round(
        (completeness_score * 0.25) +
        (validity_score * 0.25) +
        (consistency_score * 0.20) +
        (uniqueness_score * 0.15) +
        (ref_integrity_score * 0.15),
        2
    )

    total_raw_docs = sum(len(v) for v in raw_data.values() if isinstance(v, list))
    total_warehouse_docs = (
        sum(len(v) for v in dims.values()) +
        sum(len(v) for v in facts.values())
    )

    report_id = f"DQR_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    report = {
        "report_id": report_id,
        "run_timestamp": datetime.now().isoformat(),
        "records_extracted": total_raw_docs,
        "records_cleaned_and_loaded": total_warehouse_docs,
        "anomalies_sanitized_count": len(sanitized_issues),
        "metrics": {
            "completeness": completeness_score,
            "validity": validity_score,
            "consistency": consistency_score,
            "uniqueness": uniqueness_score,
            "referential_integrity": ref_integrity_score,
            "overall_score": overall_score
        },
        "issues_detected": sanitized_issues,
        "status": "PASSED" if overall_score >= 90.0 else "WARNING"
    }

    print(f"[ETL-VALIDATE] Data Quality Assessment Completed:")
    print(f"  • Completeness:           {completeness_score:>6.2f}%")
    print(f"  • Validity:               {validity_score:>6.2f}%")
    print(f"  • Consistency:            {consistency_score:>6.2f}%")
    print(f"  • Uniqueness:             {uniqueness_score:>6.2f}%")
    print(f"  • Referential Integrity:  {ref_integrity_score:>6.2f}%")
    print(f"  ============================================")
    print(f"  • OVERALL QUALITY SCORE:  {overall_score:>6.2f}% ({report['status']})")

    return report
