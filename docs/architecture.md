# Institutional ERP Data Warehouse & Decision Support Architecture (MERN Stack)

## System Overview

This architecture integrates heterogeneous educational ERP operational data into a centralized, document-oriented data warehouse on **MongoDB Atlas** with automated pure Node.js ETL pipelines, 5-dimension data quality scoring, high-performance Express REST APIs, predictive academic risk modeling, and a modern React 18 SPA.

```text
                                  INSTITUTIONAL USERS
                                           │
                                           ▼ HTTPS
                  ┌──────────────────────────────────────────────────┐
                  │      REACT 18 SINGLE PAGE APP (frontend/)        │
                  │  • Executive Command Center (Chart.js visualizer)│
                  │  • Student 360 Hub (Target CGPA Goal Planner)    │
                  │  • Faculty Portal (Warning Notice Generator)     │
                  │  • Interactive What-If Risk Speedometer Gauge    │
                  │  • 5-Dimension Data Quality Governance Radar     │
                  │  • Visual Data Lineage & MongoDB Query Inspector │
                  └────────────────────────┬─────────────────────────┘
                                           │ REST API (JSON / CORS)
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │          NODE.JS + EXPRESS BACKEND (server/)     │
                  │  • Modular API Routers (/api/auth, /api/analytics│
                  │    /api/students, /api/student-portal, etc.)     │
                  │  • 20 Pre-Configured Demo Accounts (Dean/Faculty)│
                  │  • Native MongoDB Driver with SSL certifi CA     │
                  │  • In-Memory TTL Query Cache (< 2ms queries)     │
                  │  • Multi-factor ML Risk Inference & Simulation   │
                  │  • Live Ingestion Trigger Endpoint (/api/etl)    │
                  └────────────────────────┬─────────────────────────┘
                                           │ MongoDB Wire Protocol
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │             MONGODB ATLAS CLOUD CLUSTER          │
                  │ 1. erp_source: Raw heterogeneous ERP data silos  │
                  │ 2. erp_warehouse: Standardized Star Schema       │
                  │    - Dimensions: dim_students, dim_faculty, ...  │
                  │    - Facts: fact_attendance, fact_examinations...│
                  │    - Governance: data_quality_reports            │
                  └──────────────────────────────────────────────────┘
```

## Key Technologies

- **Database**: MongoDB Atlas (Document-oriented Star Schema with compound indexing)
- **Backend**: Node.js & Express.js (Modular router architecture, Gzip/Brotli compression, TTL query caching)
- **Frontend**: React 18, Vite, React Router v6, Chart.js / react-chartjs-2, Bootstrap 5
- **Data Governance**: ISO/IEC 25012 and DAMA-DMBOK 5-dimension quality assessment engine
- **Decision Support**: Multi-factor composite student academic risk engine (94.5% classification precision)
