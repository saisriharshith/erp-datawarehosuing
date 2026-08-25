# ERP Data Warehouse and Institutional Decision Support System

An end-to-end academic demonstration of integrating heterogeneous educational ERP operational data into a centralized, document-oriented data warehouse on MongoDB Atlas with automated ETL pipelines, data quality scoring, analytical REST APIs, predictive student academic risk modeling, and a web dashboard.

---

## Architecture Overview

```
                      [ INSTITUTIONAL USERS ]
                                │
                                ▼ HTTPS
                 [ Vercel: Modern Web Dashboard ]
               HTML5 • CSS3 • Bootstrap 5 • Chart.js
                                │
                                ▼ REST API (JSON / CORS)
               [ Render: Python Flask REST Backend ]
               PyMongo • scikit-learn ML • Aggregations
                                │
                                ▼ MongoDB Wire Protocol
                  [ MongoDB Atlas Cloud DB ]
       ┌────────────────────────┴────────────────────────┐
       │                                                 │
[ erp_source (Raw Silos) ]                  [ erp_warehouse (Star Schema) ]
• Students, Admissions                      • Dimensions: dim_students, ...
• Attendance, Exams, Fees                   • Facts: fact_attendance, ...
• Faculty, Library, Subjects                • Reports: data_quality_reports
       │                                                 ▲
       └──────────────[ Python ETL Pipeline ]────────────┘
               Extract -> Transform -> Validate -> Load
```

---

## Key Highlights

1. **Heterogeneous ERP Integration**: Ingests raw data across Admissions, Academics, Attendance, Examinations, Fees, Faculty, and Library.
2. **Modular ETL Pipeline & Data Quality Assurance**: Automated cleansing, casing normalization, date standardization, deduplication, and 5-dimension quality scoring (*Completeness, Validity, Consistency, Uniqueness, Referential Integrity*).
3. **Document-Oriented Star Schema Data Warehouse**: Pre-aggregated dimensions and fact collections with server-side MongoDB Aggregation Pipelines.
4. **Machine Learning Risk Prediction**: Scikit-learn classification models predicting student academic risk tiers (`LOW`, `MEDIUM`, `HIGH`) with transparent factor breakdown.
5. **Interactive What-If Scenario Simulator**: Simulates expected academic risk changes given simulated attendance and remedial interventions.
6. **Data Lineage Transparency**: Complete audit trail explaining the origin and transformations behind every institutional KPI.
7. **Clean REST Architecture**: Decoupled Flask backend and static HTML/CSS/JS frontend ready for zero-cost deployment on Render, Vercel, and MongoDB Atlas.

---

## Directory Structure

```
.
├── backend/                  # Flask REST API application
│   ├── app.py                # App entrypoint & CORS setup
│   ├── config.py             # Configuration & environment loader
│   ├── extensions.py         # MongoDB connection singletons
│   ├── routes/               # Modular route blueprints
│   ├── services/             # Business logic & aggregation engines
│   └── utils/                # Serialization & helper functions
├── frontend/                 # Static web dashboard (Vercel-ready)
│   ├── index.html            # Role-based landing / login screen
│   ├── dashboard.html        # Executive institutional analytics
│   ├── students.html         # Student directory & 360 profile
│   ├── attendance.html       # Attendance analytics & trends
│   ├── examinations.html     # Academic examination analytics
│   ├── fees.html             # Fee collections & dues analytics
│   ├── library.html          # Library resource circulation
│   ├── faculty.html          # Faculty workload & department ratios
│   ├── risk-analysis.html    # ML Early-warning risk dashboard & What-If
│   ├── data-quality.html     # ETL & 5-dimension DQ audit reports
│   ├── css/                  # Styling & themes
│   ├── js/                   # Dynamic API bindings & Chart.js logic
│   └── assets/               # Logos & icons
├── etl/                      # Data Engineering & ETL pipeline
│   ├── extract.py            # Extract from erp_source
│   ├── transform.py          # Cleansing & normalization
│   ├── validate.py           # 5-dimension data quality rules
│   ├── load.py               # Upsert into erp_warehouse
│   └── pipeline.py           # Orchestrator & CLI runner
├── ml/                       # Machine Learning & Decision Support
│   ├── train.py              # Model training & feature engineering
│   ├── evaluate.py           # Confusion matrix & metrics
│   ├── predict.py            # Inference engine
│   └── models/               # Serialized .joblib artifacts
├── scripts/                  # Data generation & database seeds
│   ├── generate_data.py      # Synthetic raw ERP generator with anomalies
│   ├── seed_database.py      # Seeds raw data into MongoDB erp_source
│   └── run_pipeline.py       # Full end-to-end demo execution script
├── docs/                     # Architectural documentation
│   ├── CHANGELOG.md          # Implementation audit log
│   ├── architecture.md       # Technical architecture specification
│   ├── database-design.md    # Star schema & collection dictionaries
│   ├── api.md                # REST API contract & endpoints
│   └── deployment.md         # Deployment on Atlas, Render, and Vercel
├── tests/                    # Unit & Integration test suite
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions
├── requirements.txt          # Python dependencies
└── LICENSE                   # MIT License
```

---

## Quickstart

Refer to [docs/deployment.md](docs/deployment.md) for full deployment instructions on MongoDB Atlas, Render, and Vercel.
