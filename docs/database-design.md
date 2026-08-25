# MongoDB Database Design & Schema Specifications

The project maintains two distinct logical databases within MongoDB Atlas.

---

## 1. Database: `erp_source` (Operational Source Data)

| Collection | Key Fields | Description & Simulated Anomalies |
| :--- | :--- | :--- |
| `students` | `raw_student_id`, `name`, `gender`, `dob`, `contact_email`, `dept`, `adm_year` | Contains casing variants, occasional missing emails, duplicated IDs. |
| `admissions` | `application_no`, `student_name`, `dept_applied`, `quota`, `rank`, `date_of_adm` | Varied date formats (`DD-MM-YYYY`, `YYYY/MM/DD`). |
| `departments` | `code`, `name`, `hod`, `intake` | Inconsistent naming (`"CSE"`, `"Computer Sci"`, `"CS"`). |
| `subjects` | `code`, `title`, `dept_code`, `sem`, `credits` | Subject catalog. |
| `faculty` | `fac_id`, `full_name`, `dept`, `designation`, `exp_years` | Faculty profiles. |
| `attendance` | `stu_id`, `sub_code`, `date_str`, `session_type`, `is_present` | Raw daily logs with missing dates, duplicate log rows. |
| `examinations` | `stu_id`, `sub_code`, `sem`, `internal_score`, `end_sem_score`, `max_score` | Scores with negative marks or out-of-range (>100) errors. |
| `fees` | `txn_id`, `stu_id`, `amount_due`, `amount_paid`, `txn_date`, `status` | Duplicate transaction IDs, partial receipts. |
| `library` | `trans_id`, `stu_id`, `book_isbn`, `issue_date`, `return_date`, `fine` | Unreturned books and fine transactions. |

---

## 2. Database: `erp_warehouse` (Analytical Star Schema)

### Dimension Collections

#### `dim_students`
```json
{
  "_id": "STU2023001",
  "student_id": "STU2023001",
  "first_name": "Aarav",
  "last_name": "Sharma",
  "gender": "Male",
  "dob": "2003-05-12T00:00:00.000Z",
  "email": "aarav.sharma@univ.edu",
  "department_id": "DEPT_CSE",
  "department_name": "Computer Science & Engineering",
  "batch_year": 2023,
  "current_semester": 5,
  "admission_quota": "Merit",
  "is_active": true,
  "created_at": "2026-08-25T00:00:00.000Z",
  "updated_at": "2026-08-25T00:00:00.000Z"
}
```

#### `dim_departments`
```json
{
  "_id": "DEPT_CSE",
  "department_id": "DEPT_CSE",
  "department_name": "Computer Science & Engineering",
  "short_code": "CSE",
  "hod_name": "Dr. R. Ramanujan",
  "established_year": 2005,
  "total_intake": 120
}
```

#### `dim_subjects`
```json
{
  "_id": "SUB_CS501",
  "subject_id": "SUB_CS501",
  "subject_name": "Database Management Systems",
  "department_id": "DEPT_CSE",
  "semester": 5,
  "credits": 4,
  "is_elective": false
}
```

#### `dim_faculty`
```json
{
  "_id": "FAC101",
  "faculty_id": "FAC101",
  "name": "Dr. Sunita Rao",
  "department_id": "DEPT_CSE",
  "designation": "Professor",
  "qualification": "Ph.D. in Computer Science",
  "workload_hours": 16
}
```

#### `dim_dates`
```json
{
  "_id": "2024-09-01",
  "date_key": "2024-09-01",
  "academic_year": "2024-2025",
  "semester_term": "ODD",
  "month": 9,
  "month_name": "September",
  "quarter": "Q3",
  "year": 2024
}
```

---

### Fact Collections

#### `fact_attendance`
```json
{
  "_id": "ATT_2024_01_STU2023001_SUB_CS501",
  "attendance_id": "ATT_2024_01_STU2023001_SUB_CS501",
  "student_id": "STU2023001",
  "department_id": "DEPT_CSE",
  "subject_id": "SUB_CS501",
  "semester": 5,
  "academic_year": "2024-2025",
  "total_classes": 60,
  "classes_attended": 48,
  "attendance_percentage": 80.0,
  "status": "Adequate"
}
```

#### `fact_examinations`
```json
{
  "_id": "EXAM_2024_SEM5_STU2023001_SUB_CS501",
  "exam_id": "EXAM_2024_SEM5_STU2023001_SUB_CS501",
  "student_id": "STU2023001",
  "department_id": "DEPT_CSE",
  "subject_id": "SUB_CS501",
  "semester": 5,
  "academic_year": "2024-2025",
  "internal_marks": 24.0,
  "internal_max": 30,
  "end_sem_marks": 56.0,
  "end_sem_max": 70,
  "total_marks": 80.0,
  "grade_point": 8.5,
  "grade_letter": "A",
  "is_passed": true
}
```

#### `fact_fees`
```json
{
  "_id": "FEE_2024_STU2023001_SEM5",
  "fee_id": "FEE_2024_STU2023001_SEM5",
  "student_id": "STU2023001",
  "academic_year": "2024-2025",
  "semester": 5,
  "total_due": 85000,
  "total_paid": 85000,
  "outstanding_balance": 0,
  "status": "PAID",
  "last_payment_date": "2024-08-10"
}
```

#### `fact_library`
```json
{
  "_id": "LIB_2024_STU2023001",
  "student_id": "STU2023001",
  "academic_year": "2024-2025",
  "total_books_borrowed": 12,
  "overdue_instances": 1,
  "total_fine_paid": 40
}
```

---

### Audit, Quality & Prediction Collections

#### `data_quality_reports`
```json
{
  "report_id": "DQR_20260825_203000",
  "run_timestamp": "2026-08-25T20:30:00Z",
  "records_extracted": 14250,
  "records_cleaned_and_loaded": 13910,
  "records_rejected_or_fixed": 340,
  "metrics": {
    "completeness": 98.4,
    "validity": 97.9,
    "consistency": 96.5,
    "uniqueness": 99.2,
    "referential_integrity": 98.8,
    "overall_score": 98.16
  },
  "issues_detected": [
    {"table": "attendance", "issue": "Invalid attendance > 100%", "count": 14, "action": "Clamped/Sanitized"},
    {"table": "students", "issue": "Duplicate student_id", "count": 8, "action": "Deduplicated by latest timestamp"}
  ]
}
```

#### `risk_predictions`
```json
{
  "student_id": "STU2023045",
  "department_id": "DEPT_ECE",
  "semester": 5,
  "features": {
    "attendance_percentage": 58.0,
    "previous_gpa": 5.9,
    "internal_marks_avg": 42.0,
    "failed_subjects": 2,
    "library_usage": 2
  },
  "risk_score": 0.82,
  "risk_level": "HIGH",
  "risk_factors": [
    "Attendance below 60% threshold",
    "2 failed subject backlogs",
    "Low internal examination score (42%)"
  ],
  "model_version": "v1.0.0-RandomForest",
  "updated_at": "2026-08-25T20:35:00Z"
}
```
