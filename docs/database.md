# Database Schema & Data Integrity Design

## 1. Overview

VisionAttend uses **MongoDB** as its primary persistent datastore. The schema is designed for ACID-like atomicity on per-document and per-collection operations through unique compound indices and schema validation.

---

## 2. Collections & Indices

### 2.1 `users`
Administrative and Lecturer credentials for authentication.
- **Indices**:
  - `email` (Unique, Ascending)

### 2.2 `students`
Student demographic and academic records.
- **Indices**:
  - `registration_number` (Unique, Ascending)
  - `email` (Unique, Sparse, Ascending)
  - `course_id` (Ascending)
  - `enrollment_status` (Ascending)

### 2.3 `face_embeddings`
Stores 512-dimensional vector arrays and ImageKit CDN metadata.
- **Fields**:
  - `student_id`: Foreign key reference to `students._id`
  - `sample_index`: Integer 1 to 5
  - `embedding`: Array of 512 float values, normalized
  - `image_url`: ImageKit secure HTTPS URL
  - `imagekit_file_id`: ImageKit file ID for remote deletion
  - `quality_score`: Float
- **Indices**:
  - `student_id` (Ascending)
  - Compound: `(student_id, sample_index)` (Unique)

### 2.4 `attendance_sessions`
Live or completed classroom sessions.
- **Indices**:
  - `session_code` (Unique, Ascending)
  - `status` (Ascending)
  - `lecturer_id` (Ascending)
  - `course_id` (Ascending)
  - `unit_id` (Ascending)
  - `created_at` (Descending)

### 2.5 `attendance_records`
Atomic attendance marks verified via face recognition or manual lecturer entry.
- **Hard Constraint**:
  - Compound Unique Index: `(session_id, student_id)` (Unique, Ascending)
  - **Guarantees duplicate prevention**: Even if 10 consecutive video frames recognize the same student within 2 seconds, the MongoDB engine rejects subsequent insertion attempts at the storage engine level.

### 2.6 `courses`, `units`, `venues`
Academic hierarchy and venue capacity.
- `courses.course_code` (Unique)
- `units.unit_code` (Unique)
- `venues.venue_code` (Unique)

### 2.7 `audit_logs`
Compliance audit log for security, settings changes, and biometric operations.
- `created_at` (Descending)
- `user_id` (Ascending)
- `action` (Ascending)
