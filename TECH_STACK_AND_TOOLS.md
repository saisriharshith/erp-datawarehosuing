# 🛠️ Complete Tools & Technology Stack Reference

This document provides a comprehensive inventory of all **languages, frameworks, databases, libraries, algorithms, and deployment tools** used in the University ERP Data Warehouse & Decision Support System, detailing exactly **where** and **how** each tool is utilized.

---

## 📊 Summary Stack Matrix

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (Browser)                                         │
│   React 18  │  Vite 6  │  React Router 6  │  Chart.js 4  │  Bootstrap 5  │  HTML5 Print CSS      │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ HTTP / REST APIs (/api/*)
┌────────────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                                   SERVER LAYER (Node.js)                                         │
│   Express.js 4  │  Compression (Gzip)  │  CORS  │  Dotenv  │  Crypto  │  Node Test Runner        │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ MongoDB Native Driver (v6)
┌────────────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                               DATABASE & DATA WAREHOUSE LAYER                                    │
│   MongoDB Atlas  │  Document Star Schema  │  Aggregation Pipeline  │  In-Memory TTL Cache        │
│   DAMA/ISO 25012 Data Quality Engine  │  Node.js Batch ETL Engine  │  ML Predictive Classifier   │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
┌────────────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                                  DEVOPS & DEPLOYMENT LAYER                                       │
│   Docker (Multi-Stage)  │  Render.com (render.yaml)  │  Git & GitHub  │  Bash (build.sh)         │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. 🖥️ Frontend Technologies (Client Layer)

| Tool / Library | Version | Where It Is Used | Purpose & Functionality |
| :--- | :---: | :--- | :--- |
| **React** | `18.3.1` | `frontend/src/` | Component-based UI framework powering all dashboards, modals, forms, and interactive sliders. |
| **Vite** | `6.4.3` | `frontend/vite.config.js` | Lightning-fast development server, Hot Module Replacement (HMR), and optimized production bundler with manual chunk splitting. |
| **React Router DOM** | `6.28.0` | `frontend/src/App.jsx`, `Sidebar.jsx` | Client-side declarative routing, URL management, and role-based `<ProtectedLayout>` navigation. |
| **Chart.js** | `4.4.7` | `ExecutiveDashboard.jsx`, `StudentPortal.jsx`, `RiskAnalysis.jsx` | Canvas-based rendering engine for interactive charts (SGPA trend line chart, department enrollment bar chart, risk distribution doughnut). |
| **React-Chartjs-2** | `5.2.0` | `ExecutiveDashboard.jsx`, `StudentPortal.jsx` | React wrapper providing declarative component bindings (`<Line />`, `<Bar />`, `<Doughnut />`) for Chart.js. |
| **Bootstrap** | `5.3.3` | `frontend/src/index.css`, all JSX components | Responsive layout grid system, metric cards, styled tables, badges, progress bars, and modal dialogs. |
| **Bootstrap Icons** | `1.11.3` | `Navbar.jsx`, `Sidebar.jsx`, all pages | SVG and web-font icon library providing visual symbols for navigation, metrics, statuses, and warnings. |
| **React Context API** | Built-in | `AuthContext.jsx`, `ToastContext.jsx` | Global state management for user authentication sessions, active persona switching, and floating toast notifications. |
| **HTML5 Print CSS (`@media print`)** | Native CSS | `PrintableHallTicketModal.jsx`, `PrintableTranscriptModal.jsx`, `FacultyPortal.jsx` | Print-formatted stylesheets to produce official university Admit Cards, Transcripts, and Warning Notices as clean PDF printouts. |

---

## 2. ⚙️ Backend & API Technologies (Server Layer)

| Tool / Library | Version | Where It Is Used | Purpose & Functionality |
| :--- | :---: | :--- | :--- |
| **Node.js** | `v20+` | Root `server.js`, `server/server.js` | High-performance asynchronous JavaScript runtime executing backend server processes with ES Modules. |
| **Express.js** | `4.21.2` | `server/src/app.js`, `server/src/routes/` | RESTful API framework organizing endpoints for authentication, analytics, student directory, faculty rosters, ETL, and data quality. |
| **Compression** | `1.8.1` | `server/src/app.js` | Gzip compression middleware reducing payload sizes of large analytical datasets by up to 75%. |
| **CORS** | `2.8.5` | `server/src/app.js` | Middleware enabling Cross-Origin Resource Sharing for API requests from the React client. |
| **Dotenv** | `16.4.7` | `server/src/app.js` | Zero-dependency module that loads environment variables (`MONGODB_URI`, `PORT`, `NODE_ENV`) from `.env` file. |
| **Crypto** | Built-in | `server/src/routes/auth.routes.js` | SHA-256 cryptographic hashing for user password verification and random token generation for session management. |

---

## 3. 🗄️ Database & Data Warehousing Technologies

| Tool / Technology | Type | Where It Is Used | Purpose & Functionality |
| :--- | :---: | :--- | :--- |
| **MongoDB Atlas** | Cloud NoSQL DB | Cloud Cluster (Oregon / AWS) | Multi-database cloud instance hosting `erp_source` (raw operational logs) and `erp_warehouse` (analytical star schema). |
| **MongoDB Node Driver (`mongodb`)** | `6.12.0` | `server/src/config/db.js` | Native database driver providing high-speed connection pooling and asynchronous cursor querying. |
| **MongoDB Aggregation Framework** | Native Pipeline | `analytics.routes.js`, `students.routes.js` | Server-side aggregation pipelines (`$match`, `$group`, `$project`, `$lookup`, `$sort`) executing sub-2.5ms cross-department KPI queries. |
| **Document Star Schema** | Data Architecture | `erp_warehouse` collections | Dimensional data warehouse model separating descriptive Context (**Dimensions**: `dim_students`, `dim_faculty`, `dim_departments`, `dim_subjects`) from Numerical Measurements (**Facts**: `fact_attendance`, `fact_examinations`, `fact_fees`, `fact_library`). |
| **In-Memory TTL Query Cache** | Custom Caching | `server/src/config/db.js` | In-memory query caching mechanism storing frequently requested warehouse aggregations with automatic cache eviction. |

---

## 4. 🔄 ETL Pipeline & Data Quality Framework

| Tool / Method | Standard | Where It Is Used | Purpose & Functionality |
| :--- | :---: | :--- | :--- |
| **Node.js Batch ETL Engine** | Custom Script | `server/src/etl/pipeline.js`, `etl.routes.js` | Automated pipeline extracting dirty operational logs from `erp_source`, transforming them, and loading into `erp_warehouse`. |
| **DAMA-DMBOK / ISO/IEC 25012 Framework** | International Standard | `server/src/routes/quality.routes.js`, `DataQuality.jsx` | 5-Dimension automated data quality auditing engine scoring **Completeness**, **Validity**, **Consistency**, **Uniqueness**, and **Referential Integrity** (99.68% Overall Quality). |
| **KPI Lineage Tracer** | Metadata Engine | `analytics.routes.js`, `ExecutiveDashboard.jsx` | Traces calculation formulas and data provenance from UI metrics back to warehouse facts and raw database transactions. |

---

## 5. 🤖 Machine Learning & Predictive Modeling

| Tool / Algorithm | Category | Where It Is Used | Purpose & Functionality |
| :--- | :---: | :--- | :--- |
| **Multivariable Risk Scoring Model** | Classifier | `prediction.routes.js`, `studentPortal.routes.js` | Predictive algorithm analyzing student attendance rate, active backlogs, CGPA trajectory, and fee arrears to classify academic risk (**High**, **Medium**, **Low**). |
| **Delta Scenario Simulator** | What-If Engine | `prediction.routes.js`, `RiskAnalysis.jsx`, `FacultyPortal.jsx` | Real-time simulation engine calculating projected risk score reductions when hypothetical attendance and internal marks improvements are applied. |

---

## 6. 🐳 DevOps, Testing & Cloud Deployment

| Tool | Type | Where It Is Used | Purpose & Functionality |
| :--- | :---: | :--- | :--- |
| **Docker** | Containerization | `Dockerfile`, `.dockerignore` | Multi-stage production container compiling React assets in Stage 1 and packaging the Node server in Stage 2 for deterministic cross-platform deployment. |
| **Render.com** | PaaS Cloud Host | `render.yaml`, `DEPLOYMENT_RENDER_GUIDE.md` | Cloud hosting platform executing automated Git-based builds and serving the unified MERN web service. |
| **Node.js Test Runner (`node --test`)** | Automated Testing | `server/tests/api.test.js` | Native test suite verifying 9 core REST endpoints (`/api/health`, `/api/auth/login`, `/api/analytics/dashboard`, `/api/predict-risk`, etc.) with 100% pass rate. |
| **Git & GitHub** | Version Control | Root repository | Distributed source control, branching, and automated deployment trigger integration. |
| **Bash Shell (`build.sh`)** | Automation Script | `build.sh` | Shell script automating backend package installations, frontend builds, and asset compilation. |
