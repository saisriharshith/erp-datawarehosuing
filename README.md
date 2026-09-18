# VisionAttend: AI-Powered Face Recognition College Attendance System

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org)
[![InsightFace](https://img.shields.io/badge/InsightFace-buffalo__sc-orange.svg)](https://github.com/deepinsight/insightface)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%207.0-green.svg)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-grade, high-throughput facial recognition attendance management platform built for modern academic institutions. VisionAttend replaces paper attendance rolls and vulnerable PIN codes with real-time **InsightFace ArcFace 512-D** biometric verification, anti-spoofing liveness checks, and instant accreditation-ready report generation.

---

## 🌟 Key Innovations & Architectural Highlights

1. **Zero-Latency In-Memory Matching**:
   - Feature vectors are $L_2$-normalized onto the 512-dimensional unit hypersphere.
   - Spatial searches are executed entirely in-memory using matrix dot-product operations (~25ms CPU inference), eliminating per-frame database or disk I/O.
2. **True Database-Level Duplicate Prevention**:
   - Compound unique index on `attendance_records(session_id, student_id)` guarantees zero duplicate check-ins even under concurrent high-FPS video streaming.
3. **Multi-Sample Angular Aggregation**:
   - Enrolls 3 to 5 face poses per student (frontal, yaw left, yaw right, tilted).
   - Verification uses a weighted multi-sample score ($0.70 \cdot \max + 0.30 \cdot \text{second\_max}$) to handle natural variations in lighting and expression.
4. **Cloud-Native Media Separation**:
   - High-resolution face crops are stored in **ImageKit CDN**, keeping MongoDB lightweight while offering responsive thumbnail caching.
5. **Interactive Lecturer Studio**:
   - WebRTC live camera streaming with SVG bounding boxes, corner reticles, HUD metrics, and audio confirmation chimes via the Web Audio API.
6. **Executive Analytics & Export Suite**:
   - Real-time Recharts dashboards for both Admins and Lecturers.
   - 1-click export of certified attendance ledgers in **CSV**, styled **Excel (.xlsx)**, and formatted **PDF** with college letterheads.

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------------+
|                             Client Browser (React 18)                         |
|  +---------------------------+   +-------------------+   +------------------+ |
|  |   Camera Viewfinder UI    |   |  Admin Dashboard  |   | Lecturer Studio  | |
|  |  (WebRTC / Canvas 450ms)  |   |  & Reports Engine |   | & Live Roster    | |
|  +-------------+-------------+   +---------+---------+   +---------+--------+ |
+----------------|---------------------------|-----------------------|----------+
                 | Base64 JPEG Frames        | REST API (JWT Auth)   |
                 v                           v                       v
+-------------------------------------------------------------------------------+
|                            FastAPI Asynchronous Gateway                       |
|  +--------------------+  +----------------------+  +-----------------------+  |
|  |  CORS & Rate Limit |  |  JWT RBAC Middleware |  | Structured Exceptions |  |
|  +---------+----------+  +----------+-----------+  +-----------+-----------+  |
+------------|------------------------|--------------------------|--------------+
             |                        |                          |
             v                        v                          v
+-------------------------------------------------------------------------------+
|                           Core Application Services                           |
|  +---------------------------+   +-------------------+   +------------------+ |
|  | FaceRecognitionService    |   | AttendanceService |   | AnalyticsService | |
|  | - SCRFD Detection         |   | - Session State   |   | - Turnout Stats  | |
|  | - ArcFace Feature Extract |   | - Atomic Write    |   | - Retention Risk | |
|  | - Cosine Similarity Match |   | - Duplication G'd |   | - Export Engine  | |
|  +-------------+-------------+   +---------+---------+   +---------+--------+ |
|                | In-Memory Matrices        |                       |          |
|                v                           v                       v          |
|  +---------------------------+   +------------------------------------------+ |
|  | In-Memory RecognitionIdx  |   |        ReportService (PDF/Excel/CSV)     | |
|  +---------------------------+   +------------------------------------------+ |
+-------------------------------------------------------------------------------+
                 |                                           |
                 v                                           v
+-----------------------------------+       +-----------------------------------+
|      MongoDB Database Engine      |       |           ImageKit Cloud          |
|  - unique(session_id, student_id) |       |  - High-res face crops (112x112)  |
|  - 512-D float vectors            |       |  - Secure CDN thumbnail caching   |
|  - Students, Users, Sessions      |       |  - Automated purging on delete    |
+-----------------------------------+       +-----------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Python 3.11 / 3.14, FastAPI, Motor (Async MongoDB), Pydantic v2, PyJWT, bcrypt |
| **AI / Computer Vision** | InsightFace (`buffalo_sc`), ONNX Runtime, OpenCV, NumPy |
| **Database** | MongoDB 7.0 (with compound unique indexing) |
| **CDN & Storage** | ImageKit SDK |
| **Export Formats** | `reportlab` (PDF), `openpyxl` (Excel), standard CSV |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 🚀 Getting Started

### Method 1: Docker Compose (Recommended)

Run the entire cluster with a single command:

```bash
docker-compose up --build
```

- **Frontend Portal**: http://localhost:3000
- **FastAPI Documentation**: http://localhost:8000/docs
- **MongoDB**: `localhost:27017`

---

### Method 2: Local Development

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Seed demonstration database with synthetic vectors & demo users
python ../scripts/seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173 to access the development UI.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@college.edu` | `Admin@12345` | Institutional dashboard, roster, settings, faculty |
| **Lecturer (Faculty)** | `prof.smith@college.edu` | `Lecturer@12345` | Live attendance camera studio, sessions, unit analytics |
| **Lecturer (Faculty)** | `dr.jones@college.edu` | `Lecturer@12345` | Alternative instructor account |

---

## 🧪 Testing & Verification

Run the full automated test suite:

```bash
# Backend test suite (14 passing unit & integration tests)
pytest backend/tests/ -v

# Frontend TypeScript compilation & asset verification
cd frontend
npm run build
```

---

## 📚 Technical Documentation

- [System Architecture](docs/architecture.md)
- [Face Recognition & Anti-Spoofing](docs/face-recognition.md)
- [Database Schema & Indices](docs/database.md)
- [REST API Specifications](docs/api.md)
- [Security & Privacy Guarantees](docs/security.md)
- [Quality Assurance & Testing](docs/testing.md)
- [Reference Repository Analysis](docs/reference-analysis.md)

---

## 📄 License
This project is open-source software licensed under the **MIT License**.
