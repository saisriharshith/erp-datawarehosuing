# Project Changelog & Audit Record

All notable changes, architectural decisions, and module additions are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and follows semantic versioning.

---

## [Unreleased] - In Development

## [1.1.0] - Role-Based Access Control (RBAC) & Persona Portals (2026-08-25)

### Added
- **Dedicated Student Academic Portal** (`frontend/student-portal.html`): Scoped strictly to the student's personal record (Aarav Sharma - `STU2023001`). Features personal attendance percentage, exam eligibility calculator ("Must attend next X classes to reach 75%"), CGPA & backlog tracker, semester SGPA progression chart, personal fee payment ledger with receipts, library book due reminders, and tailored academic advisories.
- **Dedicated Faculty & Department Portal** (`frontend/faculty-portal.html`): Scoped to the faculty member's department (`DEPT_CSE - Computer Science & Engineering`) and assigned courses (`CS501 - DBMS`, `CS201 - DSA`). Features CSE department KPIs, attendance shortage alerts for department students, and advisee mentorship rosters with direct access to the What-If simulation engine.
- **Role-Based Dynamic Navigation & Security Guards** (`frontend/js/auth.js`):
  * Restricts students from accessing dean-level institutional revenue, raw data quality pipeline, or other students' records.
  * Restricts faculty from accessing institutional financials and governance administration.
  * Provides Dean/Admin full institutional governance, data quality, and data lineage transparency.
  * 1-Click Role Switcher on top navigation bar for evaluators to effortlessly switch between **Dean / Admin**, **Faculty (CSE HOD)**, and **Student (Aarav Sharma)**.
- **Personalized Student API Endpoint** (`backend/routes/students.py`, `backend/services/student_service.py`): `GET /api/student/portal-summary?student_id=STU2023001`.
- **Automated Test Case**: Added `test_student_portal_summary_api` in `tests/test_api.py` (total 15 tests).

## [1.0.0] - Full Implementation (2026-08-25)

### Added
- **Synthetic ERP Data Synthesis Engine** (`scripts/generate_data.py`, `scripts/seed_database.py`): Generates 600+ students across 5 departments, 45 subjects, 30 faculty, and thousands of attendance, exam, fee, and library records with controlled anomalies (casing, duplicate records, out-of-range marks, missing fields).
- **Modular ETL & Data Quality Pipeline** (`etl/`):
  * `extract.py`: Ingestion from MongoDB `erp_source` and resilient snapshot fallback.
  * `transform.py`: Department synonym normalization, ISO 8601 date parsing, range sanitization, deduplication, and star-schema loading.
  * `validate.py`: Automated 5-dimension enterprise quality scoring (Completeness, Validity, Consistency, Uniqueness, Referential Integrity).
  * `load.py`: Deterministic bulk upserts into `erp_warehouse` and index creation.
  * `pipeline.py`: Orchestrator and CLI runner.
- **Machine Learning & Decision Support System** (`ml/`):
  * `train.py`: Feature engineering, model evaluation, and risk scoring.
  * `predict.py`: Real-time risk inference and What-If scenario simulation.
  * `evaluate.py`: Confusion matrix and performance diagnostics.
- **Flask REST API & Analytical Backend** (`backend/`):
  * Modular route blueprints (`/api/health`, `/api/analytics`, `/api/students`, `/api/attendance`, `/api/examinations`, `/api/fees`, `/api/library`, `/api/faculty`, `/api/risk-students`, `/api/data-quality`, `/api/auth`).
  * PyMongo aggregation pipeline services and offline snapshot provider.
  * Role-based simulated authentication (`ADMIN`, `FACULTY`, `STUDENT`) with password hashing.
- **10-Screen Institutional Analytics Dashboard** (`frontend/`):
  * `index.html`: Login & demo persona switcher.
  * `dashboard.html`: Executive KPI overview with Chart.js charts and Data Lineage modal.
  * `students.html`: Student master directory and 360-degree academic profile drilldown.
  * `attendance.html`: Longitudinal attendance compliance & shortage distributions.
  * `examinations.html`: Pass rates, GPA progression, and grade distributions.
  * `fees.html`: Fee recovery efficiency, arrears, and payment channels.
  * `library.html`: Resource borrowing velocity and fines tracking.
  * `faculty.html`: Teaching workload and departmental ratios.
  * `risk-analysis.html`: Early-warning distress detector and interactive What-If simulation slider.
  * `data-quality.html`: 5-dimension governance dashboard and sanitation audit trail.
- **Comprehensive Test Suite** (`tests/`): 14 unit and integration tests verifying ETL pipelines, 5-dimension quality scoring, and REST API contract endpoints.
- **End-to-End Runner** (`scripts/run_pipeline.py`): Single command to generate data, run ETL, train ML model, and verify test suites.
