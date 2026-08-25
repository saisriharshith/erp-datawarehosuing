# Institutional ERP Data Warehouse & Decision Support System (MERN Stack)

A full enterprise **MERN Stack (MongoDB Atlas + Express.js + React.js + Node.js)** implementation of an institutional ERP Data Warehouse and Predictive Academic Decision Support System. Features document-oriented star schema modeling, automated ETL data quality validation, Scikit-learn & Node analytical risk forecasting, interactive What-If scenario simulations, and role-based personas across 20 verified student, faculty, and administrative accounts.

---

## 🏛️ MERN Architecture Overview

```text
                                  INSTITUTIONAL USERS
                                           │
                                           ▼ HTTPS
                  ┌──────────────────────────────────────────────────┐
                  │          REACT.JS SPA FRONTEND (Vite / React 18) │
                  │  • Executive Institutional Command Center        │
                  │  • Student 360 Hub (CGPA Goal Planner, Debarment)│
                  │  • Faculty Portal (Warning Generator, Workload)  │
                  │  • Interactive What-If Risk Speedometer Gauge    │
                  │  • 5-Dimension Data Quality Governance Audit     │
                  │  • Visual Data Lineage & MongoDB Query Inspector │
                  └────────────────────────┬─────────────────────────┘
                                           │ REST API (JSON / CORS)
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │             NODE.JS + EXPRESS.JS BACKEND         │
                  │  • Modular API Routers (/api/auth, /api/analytics│
                  │    /api/students, /api/student-portal, etc.)     │
                  │  • 20 Pre-Configured Demo Accounts (Dean/Faculty)│
                  │  • Native MongoDB Driver with SSL certifi CA     │
                  │  • Multi-factor ML Risk Inference & Simulation   │
                  │  • Live ETL Trigger Endpoint (/api/etl/trigger)  │
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

---

## 🚀 Quick Start (MERN Stack)

### 1. Install Dependencies
```bash
# Install server dependencies
cd server && npm install && cd ..

# Install React client dependencies
cd client-react && npm install && cd ..
```

### 2. Build React Client
```bash
npm run client:build
```

### 3. Start MERN Backend & Serve Full Application
```bash
npm start
```
* **Full Web Application (React SPA + API)**: `http://localhost:5001`
* **Health Endpoint**: `http://localhost:5001/api/health`
* **Dashboard API**: `http://localhost:5001/api/analytics/dashboard`

---

## 🛠️ Development Mode (Hot Reloading)

To run the React Vite dev server and Node Express server concurrently:

```bash
# Terminal 1: Node.js Express Backend (Port 5001)
npm run server:watch

# Terminal 2: React Vite Dev Server (Port 3000)
npm run client
```
Open `http://localhost:3000` in your browser.

---

## 🔑 20 Pre-Configured Demo Accounts (Password: `demo1234`)

Use the **1-Click Demo Account Picker** on the login page to immediately sign in as any of the following:

1. **Leadership / Admin (2)**: `admin@univ.edu` (Dean Dr. Sarah Jenkins), `provost@univ.edu` (Provost Prof. Arthur Pendelton)
2. **Faculty / HODs (8)**: `cse.hod@univ.edu`, `ece.hod@univ.edu`, `mech.hod@univ.edu`, `civil.hod@univ.edu`, `aids.hod@univ.edu`, `prof.sharma@univ.edu`, `prof.reddy@univ.edu`, `faculty@univ.edu`
3. **Students across 5 Departments (10)**: `aarav@univ.edu` (CSE Sem 5), `sneha@univ.edu` (CSE Sem 2), `vikram@univ.edu` (AI&DS Sem 8), `ananya@univ.edu` (ECE Sem 4), `rohan@univ.edu` (MECH Sem 3), `priya.patel@univ.edu` (CIVIL Sem 6), `karthik@univ.edu` (CSE Sem 7), `pooja@univ.edu` (AI&DS Sem 1), `rahul@univ.edu` (ECE Sem 5), `divya@univ.edu` (MECH Sem 6)

---

## 🧪 Automated Test Suite (100% Passing)

### Run MERN Backend API Tests
```bash
NODE_ENV=test node --test server/tests/api.test.js
```
```text
▶ MERN Backend API Test Suite
  ✔ GET /api/health should return online status
  ✔ POST /api/auth/login with valid credentials should authenticate
  ✔ POST /api/auth/login with invalid password should fail with 401
  ✔ GET /api/analytics/dashboard should return summary KPIs
  ✔ GET /api/student/portal-summary for STU20210001 should return student hub
  ✔ GET /api/faculty/summary should return department faculty
  ✔ POST /api/predict-risk should return ML risk prediction
  ✔ POST /api/simulate-scenario should return delta risk impact
  ✔ GET /api/data-quality should return 5-dimension quality scores
✔ MERN Backend API Test Suite (100% Passed)
```

---

## 📁 Repository Directory Structure

```text
.
├── server/                     # Express.js & Node.js Backend
│   ├── src/
│   │   ├── index.js            # Express app & static server
│   │   ├── config/db.js        # MongoDB Atlas connection & fallback
│   │   ├── routes/             # REST API routers (auth, analytics, students, etc.)
│   │   └── utils/              # API helper envelopes
│   └── tests/api.test.js       # Node.js test runner
│
├── client-react/               # Modern React SPA (Vite / React 18 / Chart.js)
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, LineageModal, ETLModal
│   │   ├── context/            # AuthContext (20 Demo Accounts)
│   │   ├── pages/              # ExecutiveDashboard, StudentPortal, FacultyPortal,
│   │   │                       # StudentsDirectory, RiskAnalysis, DataQuality
│   │   ├── App.jsx             # React Router v6 & ProtectedLayout
│   │   └── main.jsx            # Entrypoint
│   └── vite.config.js          # Vite proxy & build configuration
│
├── data/                       # Raw ERP & Data Warehouse JSON Snapshots
├── etl/                        # Modular ETL Pipeline (Extract, Transform, Validate, Load)
├── ml/                         # Scikit-learn Risk Prediction Models
├── scripts/                    # Synthetic data generators & seed utilities
└── package.json                # Root orchestration scripts
```
