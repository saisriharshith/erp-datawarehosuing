# REST API Documentation

Base URL (Development): `http://localhost:5001/api`  
Base URL (Production): `https://<render-backend-url>/api`

All responses are encoded in `application/json; charset=utf-8`.

---

## 1. System Health & Lineage

### `GET /health`
Returns backend service availability and database connectivity checks.
```json
{
  "status": "ok",
  "service": "ERP Data Warehouse & Decision Support API",
  "version": "1.0.0",
  "databases": {
    "erp_source": "connected",
    "erp_warehouse": "connected"
  }
}
```

### `GET /analytics/lineage`
Returns the exact data lineage for a calculated KPI or dimension.
- Query Parameter: `metric` (e.g. `average_attendance`, `outstanding_fees`)
```json
{
  "metric_key": "average_attendance",
  "display_name": "Average Student Attendance",
  "source_collection": "erp_source.attendance",
  "warehouse_collection": "erp_warehouse.fact_attendance",
  "calculation_logic": "AVG(classes_attended / total_classes * 100)",
  "etl_transformations": [
    "Filtered out session dates with null timestamps",
    "Deduplicated double check-in logs within 15-minute windows",
    "Clamped anomalous attendance counts > total classes"
  ],
  "last_updated": "2026-08-25T20:30:00Z"
}
```

---

## 2. Institutional Analytics & Dashboard

### `GET /analytics/dashboard`
Fetches executive-level KPI cards and department distributions.
- Optional Query Parameters: `department_id`, `semester`, `academic_year`
```json
{
  "summary_kpis": {
    "total_students": 850,
    "average_attendance": 78.4,
    "average_marks": 72.8,
    "fee_collection_rate": 88.5,
    "total_fees_collected": 54200000,
    "total_outstanding_fees": 7050000,
    "high_risk_students_count": 42,
    "data_quality_score": 98.16
  },
  "department_distribution": [
    {"department_id": "DEPT_CSE", "name": "Computer Science", "student_count": 280, "avg_attendance": 81.2, "avg_marks": 76.4},
    {"department_id": "DEPT_ECE", "name": "Electronics & Comm", "student_count": 210, "avg_attendance": 77.1, "avg_marks": 71.8},
    {"department_id": "DEPT_MECH", "name": "Mechanical Eng", "student_count": 180, "avg_attendance": 75.3, "avg_marks": 69.2},
    {"department_id": "DEPT_CIVIL", "name": "Civil Eng", "student_count": 180, "avg_attendance": 76.8, "avg_marks": 70.5}
  ],
  "attendance_trends": [
    {"month": "Aug", "attendance": 84.2},
    {"month": "Sep", "attendance": 80.5},
    {"month": "Oct", "attendance": 76.1},
    {"month": "Nov", "attendance": 73.8}
  ]
}
```

---

## 3. Student 360 & Profiles

### `GET /students`
Paginated search and filter for students.
- Query Parameters: `page` (default 1), `limit` (default 20), `department_id`, `semester`, `search` (name or student_id)
```json
{
  "total": 850,
  "page": 1,
  "limit": 20,
  "pages": 43,
  "students": [
    {
      "student_id": "STU2023001",
      "name": "Aarav Sharma",
      "department_name": "Computer Science & Engineering",
      "current_semester": 5,
      "attendance_percentage": 80.0,
      "cgpa": 8.1,
      "risk_level": "LOW",
      "fee_status": "PAID"
    }
  ]
}
```

### `GET /students/<student_id>`
Returns complete 360-degree academic profile.
```json
{
  "student": {
    "student_id": "STU2023001",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@univ.edu",
    "gender": "Male",
    "department_id": "DEPT_CSE",
    "department_name": "Computer Science & Engineering",
    "semester": 5,
    "batch_year": 2023
  },
  "attendance_summary": {
    "overall_percentage": 80.0,
    "total_classes": 240,
    "classes_attended": 192,
    "subject_breakdown": [
      {"subject_id": "SUB_CS501", "subject_name": "DBMS", "percentage": 82.5},
      {"subject_id": "SUB_CS502", "subject_name": "OS", "percentage": 77.5}
    ]
  },
  "examination_history": {
    "cgpa": 8.1,
    "total_credits": 88,
    "backlogs": 0,
    "semesters": [
      {"semester": 4, "sgpa": 8.3},
      {"semester": 5, "sgpa": 7.9}
    ]
  },
  "fee_status": {
    "total_due": 85000,
    "total_paid": 85000,
    "outstanding": 0,
    "status": "PAID"
  },
  "library_summary": {
    "books_borrowed": 12,
    "fines_paid": 40
  },
  "risk_assessment": {
    "risk_score": 0.15,
    "risk_level": "LOW",
    "risk_factors": ["Good attendance record", "No subject backlogs"]
  }
}
```

---

## 4. Machine Learning & Decision Support

### `GET /risk-students`
Lists students flagged for academic intervention.
- Query Parameters: `risk_level` (`HIGH`, `MEDIUM`), `department_id`, `semester`
```json
{
  "count": 42,
  "high_risk_count": 18,
  "medium_risk_count": 24,
  "students": [
    {
      "student_id": "STU2023045",
      "name": "Rohan Verma",
      "department_name": "Electronics & Communication",
      "semester": 5,
      "attendance_percentage": 58.0,
      "cgpa": 5.9,
      "risk_level": "HIGH",
      "risk_score": 0.82,
      "risk_factors": [
        "Attendance below 60%",
        "2 subject backlogs",
        "Low internal marks average"
      ]
    }
  ]
}
```

### `POST /predict-risk`
Calculates instant risk classification for hypothetical or updated student features.
**Request Body:**
```json
{
  "attendance_percentage": 62.0,
  "previous_gpa": 6.1,
  "internal_marks_avg": 48.0,
  "failed_subjects": 1,
  "library_usage": 3
}
```
**Response:**
```json
{
  "predicted_risk_level": "HIGH",
  "risk_probability": 0.74,
  "top_risk_drivers": [
    {"feature": "attendance_percentage", "impact": "High Negative Impact (62.0%)"},
    {"feature": "failed_subjects", "impact": "1 active backlog"}
  ],
  "recommendations": [
    "Recommend mandatory faculty counseling",
    "Schedule remedial tutoring for backlogged subjects"
  ]
}
```

### `POST /simulate-scenario` (What-If Analysis)
Simulates how target interventions change predicted risk outcomes.
**Request Body:**
```json
{
  "student_id": "STU2023045",
  "interventions": {
    "target_attendance": 80.0,
    "remedial_score_boost": 15.0,
    "cleared_backlogs": 1
  }
}
```
**Response:**
```json
{
  "student_id": "STU2023045",
  "disclaimer": "Scenario Simulation: Model-derived projection for decision support; not a guaranteed outcome.",
  "baseline": {
    "attendance": 58.0,
    "risk_level": "HIGH",
    "risk_score": 0.82
  },
  "simulated": {
    "attendance": 80.0,
    "risk_level": "LOW",
    "risk_score": 0.28,
    "risk_reduction_pct": 65.8
  }
}
```

---

## 5. Data Quality & ETL Audit

### `GET /data-quality`
Retrieves latest data quality report, dimension scores, and cleansing logs.
```json
{
  "latest_report": {
    "timestamp": "2026-08-25T20:30:00Z",
    "overall_score": 98.16,
    "dimensions": {
      "completeness": 98.4,
      "validity": 97.9,
      "consistency": 96.5,
      "uniqueness": 99.2,
      "referential_integrity": 98.8
    },
    "records_audited": 14250,
    "issues_resolved": 340
  },
  "historical_trends": [
    {"date": "2026-08-23", "score": 96.2},
    {"date": "2026-08-24", "score": 97.4},
    {"date": "2026-08-25", "score": 98.16}
  ]
}
```
