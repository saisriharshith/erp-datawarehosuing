"""
Pytest Test Configuration and Async Fixtures
Uses in-memory MongoMock database for ultra-fast, isolated testing without external dependencies.
"""

import asyncio
import os
import sys
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.config import settings
from backend.app.core.database import db_manager, ensure_database_indexes
from backend.app.core.security import get_password_hash, create_access_token
from backend.app.main import app
from backend.app.models.user import UserRole
from backend.app.services.face_recognition import recognition_index


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def init_test_db():
    """Initializes a fresh in-memory mock database for each test suite."""
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client["test_attendance_db"]

    db_manager.client = mock_client
    db_manager.db = mock_db
    db_manager.is_mock = True

    await ensure_database_indexes(mock_db)
    yield mock_db
    mock_client.close()


@pytest_asyncio.fixture
async def client():
    """HTTP async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_auth(init_test_db):
    """Seeds an admin user and returns Authorization headers."""
    db = init_test_db
    user_doc = {
        "email": "test_admin@college.edu",
        "hashed_password": get_password_hash("AdminPass123"),
        "full_name": "Test Admin",
        "role": UserRole.ADMIN,
        "is_active": True
    }
    res = await db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    token = create_access_token({
        "sub": user_id,
        "email": user_doc["email"],
        "role": UserRole.ADMIN,
        "full_name": user_doc["full_name"]
    })
    return {"Authorization": f"Bearer {token}", "user_id": user_id}


@pytest_asyncio.fixture
async def lecturer_auth(init_test_db):
    """Seeds a lecturer user & profile and returns Authorization headers."""
    db = init_test_db
    user_doc = {
        "email": "test_lecturer@college.edu",
        "hashed_password": get_password_hash("LecPass123"),
        "full_name": "Test Lecturer",
        "role": UserRole.LECTURER,
        "is_active": True
    }
    res = await db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    await db.lecturers.insert_one({
        "user_id": user_id,
        "staff_id": "LEC-TEST-01",
        "full_name": "Test Lecturer",
        "email": user_doc["email"],
        "department": "Computing",
        "assigned_courses": [],
        "assigned_units": []
    })

    token = create_access_token({
        "sub": user_id,
        "email": user_doc["email"],
        "role": UserRole.LECTURER,
        "full_name": user_doc["full_name"]
    })
    return {"Authorization": f"Bearer {token}", "user_id": user_id}
