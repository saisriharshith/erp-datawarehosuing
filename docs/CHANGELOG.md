# Project Changelog & Audit Record

All notable changes, architectural decisions, and module additions are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and follows semantic versioning.

---

## [Unreleased] - In Development

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
