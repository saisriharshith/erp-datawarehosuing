# Architecture & System Design

## 1. System Overview

**VisionAttend** is a production-grade, AI-powered Face Recognition College Attendance Management System designed to modernize higher-education attendance workflows. It eliminates paper rolls, proxy attendance, and slow manual roll-calls through high-throughput facial recognition.

### Key Architectural Tenets
1. **Separation of Concerns**: Decoupled asynchronous FastAPI backend and a modern React 18 TypeScript single-page application.
2. **Zero-Latency In-Memory Matching**: Facial feature vectors are unit-normalized ($L_2 = 1.0$) and indexed in an in-memory spatial search matrix upon startup and dynamic re-enrollment. During camera streaming, no roundtrips to disk or cloud storage are executed.
3. **Database-Level Integrity**: Enforces strict unique compound constraints on MongoDB collections, guaranteeing that duplicate attendance records cannot be created under concurrent frame evaluations.
4. **Cloud-Native Asset Separation**: Raw cropped face photos are streamed directly to ImageKit CDN with secure transformation URLs, while 512-D float vectors and metadata are stored in MongoDB.

---

## 2. High-Level System Architecture

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

## 3. Real-Time Camera Inference Pipeline

When a lecturer initiates live camera scanning in the classroom:
1. **Frame Ingest**: The React client uses WebRTC `navigator.mediaDevices.getUserMedia` at 1280x720 resolution. Every 450ms, a video frame is drawn onto an offscreen canvas and encoded as a high-quality JPEG base64 payload.
2. **Asynchronous Dispatch**: The payload is sent via HTTP POST to `/api/v1/attendance/sessions/{session_id}/recognize`. A request guard in the frontend guarantees that only one recognition request is in flight at any given instant.
3. **OpenCV & SCRFD Detection**: The backend decodes the base64 buffer into a BGR numpy matrix and invokes SCRFD face detection. If no face or multiple faces are found, bounding boxes are generated with corresponding classification statuses.
4. **ArcFace Embedding**: Each detected face is normalized and aligned using 5-point facial landmarks, then mapped to a 512-dimensional vector on the unit hypersphere:
   $$\|\mathbf{v}\|_2 = 1.0$$
5. **In-Memory Matrix Search**: The embedding vector is compared against all preloaded student vectors using dot-product matrix multiplication:
   $$\text{similarity} = \mathbf{u} \cdot \mathbf{v}$$
   If the multi-sample aggregated similarity exceeds the configurable `FACE_SIMILARITY_THRESHOLD` (default: 0.45), the student is identified.
6. **Atomic Attendance Write**: The system performs a MongoDB `find_one_and_update` or indexed insert with compound uniqueness on `(session_id, student_id)`. If the student was already marked in the current session, the record status returns `ALREADY_MARKED`. Otherwise, `NEW_PRESENT` is recorded.
7. **Client Feedback**: The frontend receives the bounding box coordinates, student name, similarity score, and attendance status. Overlays are drawn on screen, the live roster updates, and a soft audio chime confirms the attendance event.
