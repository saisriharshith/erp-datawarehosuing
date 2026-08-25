# Architecture Specification

## 1. System Overview

The **ERP Data Warehouse & Institutional Decision Support System** simulates how a higher-education institution integrates heterogeneous transactional ERP databases into an analytical Data Warehouse on MongoDB.

The system is designed with a strict **n-tier decoupled architecture**:

```
[ Institutional Users ]
         │
         ▼ (HTTPS)
[ Frontend Layer (Vercel) ] ── (HTML5 / CSS3 / Vanilla JS / Bootstrap 5 / Chart.js)
         │
         ▼ (REST API / JSON)
[ Backend & Analytics Layer (Render) ] ── (Python 3 / Flask / PyMongo / scikit-learn)
         │
         ▼ (MongoDB Wire Protocol)
[ Centralized Data Warehouse & Source Storage (MongoDB Atlas) ]
   ├── Database: erp_source (Raw Operational Silos)
   └── Database: erp_warehouse (Star Schema Dimensions & Facts)
         ▲
         │ (ETL Pipeline / Data Quality Assurance)
[ Data Engineering Layer (Python / Pandas / PyMongo) ]
```

---

## 2. Layered Responsibilities

### Layer A: Operational Source Silos (`erp_source`)
- Simulates distinct departmental modules (Admissions, Students, Attendance, Exams, Fees, Library, Faculty).
- Contains real-world noise: duplicate records, unstandardized department names, inconsistent date formats, missing fields, out-of-range test values.

### Layer B: ETL & Data Quality Assurance (`etl/`)
- **Extract**: Connects to `erp_source` and extracts raw documents.
- **Transform**: Standardizes text casings, maps department synonyms (`"Comp Sci"` -> `"DEPT_CSE"`), parses multiple date formats into ISO 8601, imputes missing values, and calculates derived metrics.
- **Validate**: Runs rule engines across 5 Data Quality dimensions (Completeness, Validity, Consistency, Uniqueness, Referential Integrity).
- **Load**: Performs deterministic upserts into `erp_warehouse` dimensional tables (`dim_*`) and fact collections (`fact_*`).
- Generates data quality reports stored in `data_quality_reports`.

### Layer C: Centralized Data Warehouse (`erp_warehouse`)
- Document-oriented Star Schema.
- Dimension collections (`dim_students`, `dim_departments`, `dim_subjects`, `dim_faculty`, `dim_dates`).
- Fact collections (`fact_attendance`, `fact_examinations`, `fact_fees`, `fact_library`).
- Aggregation Pipeline-ready indexes on `student_id`, `department_id`, `academic_year`, and `semester`.

### Layer D: Backend REST API (`backend/`)
- Flask modular application using Blueprints.
- Direct MongoDB Aggregation Pipelines to compute server-side KPI summaries without downloading entire datasets into memory.
- ML inference services and scenario simulation.
- Exposes clean JSON REST endpoints with CORS headers and status codes.

### Layer E: Machine Learning & Decision Support (`ml/`)
- Scikit-learn classification pipeline (Logistic Regression & Random Forest) to predict student academic risk tiers (`LOW`, `MEDIUM`, `HIGH`).
- Persistence using `joblib`.
- Transparent feature contribution analysis explaining why a student is flagged as high risk.
- Interactive What-If simulation engine.

### Layer F: Presentation & Web Dashboard (`frontend/`)
- Lightweight, framework-free static client (HTML5, Bootstrap 5, Chart.js, Vanilla JS).
- Deployable to Vercel with zero Node.js build dependencies.
- Dynamic data binding via `fetch()` to Flask REST APIs.
- Dedicated screens for Executive Overview, Student 360, Department Analytics, Early Warning Risk, What-If Simulation, and Data Quality & Lineage.
