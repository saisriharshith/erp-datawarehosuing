# Quality Assurance & Testing Suite

## 1. Test Architecture

The testing suite utilizes `pytest` with `pytest-asyncio` and `httpx.AsyncClient` for high-fidelity integration testing against FastAPI endpoints.

### Key Test Suites:
- **`test_auth.py`**: Validates JWT login, bad password rejection, token expiry, and `/auth/me` profile retrieval.
- **`test_academic.py`**: Tests full CRUD operations for Courses, Units, and Venues.
- **`test_students.py`**: Tests student registration, duplicate student ID rejections, filtering, and profile updates.
- **`test_face_recognition.py`**: Tests $L_2$ normalization math, cosine similarity calculations, and synthetic 512-D spatial matching.
- **`test_attendance.py`**: Validates session lifecycle (`CREATED` $\to$ `ACTIVE` $\to$ `COMPLETED`), attendance marking, and compound unique duplicate prevention.
- **`test_reports.py`**: Tests CSV, styled Excel (.xlsx), and PDF binary generation.
- **`test_analytics_admin.py`**: Tests administrative metrics aggregation and low-attendance risk calculations.

---

## 2. Executing the Test Suite

Run all tests via pytest:

```bash
cd backend
pytest tests/ -v
```

All 14 tests execute in under 6 seconds with 100% pass rate.
