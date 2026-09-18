# REST API Reference

VisionAttend exposes a structured RESTful API under the prefix `/api/v1`. All endpoints return JSON responses with standard HTTP status codes.

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/login`
Authenticates a user with email and password. Returns a JWT bearer token.
- **Request Body**:
  ```json
  {
    "email": "admin@college.edu",
    "password": "Password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": "66ea...a1",
      "email": "admin@college.edu",
      "full_name": "Dr. Sarah Administrator",
      "role": "ADMIN"
    }
  }
  ```

### `GET /auth/me`
Retrieves details of the currently authenticated principal user.

---

## 2. Students & Biometrics (`/api/v1/students`, `/api/v1/enrollment`)

### `GET /students`
Lists students with optional filters (`search`, `course_id`, `enrollment_status`, `page`, `page_size`).

### `POST /students`
Registers a new student profile.

### `POST /enrollment/{student_id}/samples`
Uploads a base64 camera crop, checks liveness, extracts ArcFace embedding, updates ImageKit and MongoDB, and triggers in-memory index rebuild.

### `GET /enrollment/{student_id}/info`
Retrieves count of biometric samples, target count, and preview URLs.

### `DELETE /enrollment/{student_id}`
Purges all biometric embeddings and CDN images for the student.

---

## 3. Real-Time Attendance (`/api/v1/attendance`)

### `POST /attendance/sessions`
Creates a new lecture session.

### `POST /attendance/sessions/{id}/start`
Transitions session status to `ACTIVE`.

### `POST /attendance/sessions/{id}/stop`
Closes session and sets status to `COMPLETED`.

### `POST /attendance/sessions/{id}/recognize`
Accepts live JPEG video frame in base64. Runs SCRFD detection and ArcFace vector matching against in-memory index.
- **Request Body**:
  ```json
  {
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "session_id": "66ea...f8",
    "faces": [
      {
        "box": [120, 85, 340, 310],
        "student_id": "66ea...b2",
        "student_name": "Jane Doe",
        "registration_number": "SC211/0001/2023",
        "similarity_score": 0.892,
        "status": "NEW_PRESENT",
        "is_live": true
      }
    ],
    "total_present": 14,
    "newly_marked_count": 1,
    "processing_time_ms": 28.4
  }
  ```

---

## 4. Reports & Exports (`/api/v1/reports`)

- `GET /reports/attendance`: Returns JSON records with attendance rate.
- `GET /reports/export/csv`: Streaming CSV file attachment.
- `GET /reports/export/excel`: Streaming styled Excel `.xlsx` workbook.
- `GET /reports/export/pdf`: Streaming formatted PDF document with college header.

---

## 5. System Administration (`/api/v1/admin`)

- `GET /admin/settings`: Retrieves cosine threshold and liveness rules.
- `PUT /admin/settings`: Updates thresholds dynamically.
- `GET /admin/audit-logs`: Retrieves immutable administrative event trail.
