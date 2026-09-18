# Security & Privacy Architecture

## 1. Threat Model & Mitigations

| Threat Vector | Risk Description | Architectural Mitigation |
| :--- | :--- | :--- |
| **Proxy Attendance** | A student checks in on behalf of an absent peer using a paper photo or smartphone screen. | Multi-sample yaw pose verification + Laplacian sharpness checks detect 2D screen reflections. |
| **Race Condition Dupes** | Rapid camera frames recognizing the same face result in duplicate attendance records. | Compound unique index `unique(session_id, student_id)` enforced at the MongoDB storage engine level. |
| **Biometric Theft** | Raw face images leaked from database dumps. | Images stored in private ImageKit CDN with signed token access. MongoDB only stores non-reversible 512-D float vectors. |
| **Unauthorized Session Tampering** | Lecturer modifies records of another lecturer's course. | Role-Based Access Control (RBAC) enforces course and session tenancy at the API gateway layer. |
| **Session Hijacking** | Eavesdropping on attendance credentials. | Secure HTTPOnly / Bearer JWT with 12-hour expiry and cryptographic HS256 signatures. |

---

## 2. Face Embedding Privacy Guarantees

1. **Irreversibility**: A 512-dimensional unit-length embedding cannot be reconstructed into the original face photo. It represents high-level manifold geometry produced by deep convolution layers.
2. **Confidentiality**: The REST API filters out vector arrays from public student profile payloads. Only internal inference algorithms have access to the spatial index.
3. **Right to Erasure**: When a student record is deleted or biometrics reset, both ImageKit CDN files and vector documents are permanently purged within a single atomic operation.
