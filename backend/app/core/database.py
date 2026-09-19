"""
MongoDB Database Engine Module
Supports AsyncIOMotorClient with automated index creation and mongomock fallback.
"""

from typing import Optional
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo
from .config import settings
from .logging import logger

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_mock: bool = False

db_manager = DatabaseManager()


async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at: {settings.MONGODB_URI} (DB: {settings.MONGODB_DATABASE})")
    try:
        motor_kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
        }
        try:
            import certifi
            motor_kwargs["tlsCAFile"] = certifi.where()
        except ImportError:
            pass

        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            **motor_kwargs
        )
        # Test ping
        await client.admin.command('ping')
        db_manager.client = client
        db_manager.db = client[settings.MONGODB_DATABASE]
        db_manager.is_mock = False
        logger.info(f"Successfully connected to live MongoDB! Active database: '{settings.MONGODB_DATABASE}'")
    except Exception as exc:
        if settings.USE_MOCK_DB_IF_UNAVAILABLE:
            logger.warning(
                f"Could not connect to live MongoDB ({exc}). "
                f"Falling back to in-memory mongomock-motor for local development/testing."
            )
            from mongomock_motor import AsyncMongoMockClient
            mock_client = AsyncMongoMockClient()
            db_manager.client = mock_client
            db_manager.db = mock_client[settings.MONGODB_DATABASE]
            db_manager.is_mock = True
            logger.info("Initialized in-memory MongoMock database successfully.")
        else:
            logger.error(f"Fatal MongoDB connection error: {exc}")
            raise exc

    # Ensure required indexes
    await ensure_database_indexes(db_manager.db)

    # Auto-seed default credentials if empty database
    await ensure_seed_data_if_empty(db_manager.db)


async def ensure_seed_data_if_empty(db: AsyncIOMotorDatabase):
    """Auto-seeds default credentials and demo hierarchy if the database is unpopulated."""
    try:
        user_count = await db.users.count_documents({})
        if user_count > 0:
            return

        logger.info("Empty database detected. Auto-seeding initial development credentials and courses...")
        from datetime import datetime, timezone
        from .security import get_password_hash
        from ..models.user import UserRole
        now = datetime.now(timezone.utc)

        # Admin User
        admin_doc = {
            "email": "admin@college.edu",
            "hashed_password": get_password_hash("Admin@12345"),
            "full_name": "Admin",
            "role": UserRole.ADMIN,
            "is_active": True,
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            "created_at": now,
            "updated_at": now
        }
        await db.users.insert_one(admin_doc)

        # Lecturer 1
        lec1_user = {
            "email": "prof.smith@college.edu",
            "hashed_password": get_password_hash("Lecturer@12345"),
            "full_name": "Prof. John Smith",
            "role": UserRole.LECTURER,
            "is_active": True,
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "created_at": now,
            "updated_at": now
        }
        l1_res = await db.users.insert_one(lec1_user)
        lec1_uid = str(l1_res.inserted_id)

        # Lecturer 2
        lec2_user = {
            "email": "dr.jones@college.edu",
            "hashed_password": get_password_hash("Lecturer@12345"),
            "full_name": "Dr. Sarah Jones",
            "role": UserRole.LECTURER,
            "is_active": True,
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            "created_at": now,
            "updated_at": now
        }
        l2_res = await db.users.insert_one(lec2_user)
        lec2_uid = str(l2_res.inserted_id)

        # Courses
        courses_data = [
            {"course_code": "BCT", "title": "Computer Technology", "department": "Computing & IT", "credits": 4, "duration_years": 4, "is_active": True, "created_at": now, "updated_at": now},
            {"course_code": "BSE", "title": "Software Engineering", "department": "Computing & IT", "credits": 4, "duration_years": 4, "is_active": True, "created_at": now, "updated_at": now},
            {"course_code": "AIDS", "title": "AI & Data Science", "department": "Artificial Intelligence", "credits": 4, "duration_years": 4, "is_active": True, "created_at": now, "updated_at": now},
        ]
        courses_inserted = await db.courses.insert_many(courses_data)
        c_bct_id = str(courses_inserted.inserted_ids[0])
        c_bse_id = str(courses_inserted.inserted_ids[1])
        c_aids_id = str(courses_inserted.inserted_ids[2])

        # Units
        units_data = [
            {"unit_code": "BCT 2411", "name": "Project Implementation", "course_id": c_bct_id, "credit_hours": 3, "description": "Hands-on project development", "is_active": True, "created_at": now, "updated_at": now},
            {"unit_code": "CS 3102", "name": "Computer Vision & ML", "course_id": c_bct_id, "credit_hours": 4, "description": "Image processing and deep learning", "is_active": True, "created_at": now, "updated_at": now},
            {"unit_code": "SE 2201", "name": "Cloud Computing Architecture", "course_id": c_bse_id, "credit_hours": 3, "description": "Microservices and cloud infrastructure", "is_active": True, "created_at": now, "updated_at": now},
            {"unit_code": "AI 4101", "name": "Deep Neural Networks", "course_id": c_aids_id, "credit_hours": 4, "description": "Advanced convolutional networks", "is_active": True, "created_at": now, "updated_at": now},
        ]
        units_inserted = await db.units.insert_many(units_data)
        u_proj_id = str(units_inserted.inserted_ids[0])
        u_cv_id = str(units_inserted.inserted_ids[1])

        # Venues
        venues_data = [
            {"venue_code": "LH-101", "name": "Lecture Hall 101", "building": "Engineering Block A", "room_number": "101", "capacity": 60, "venue_type": "LECTURE_HALL", "is_active": True, "created_at": now, "updated_at": now},
            {"venue_code": "LAB-B34", "name": "Turing Vision Lab", "building": "Computing Complex", "room_number": "B34", "capacity": 45, "venue_type": "LABORATORY", "is_active": True, "created_at": now, "updated_at": now},
        ]
        await db.venues.insert_many(venues_data)

        # Lecturer profiles
        await db.lecturers.insert_many([
            {
                "user_id": lec1_uid,
                "staff_id": "LEC-CIT-001",
                "full_name": "Prof. John Smith",
                "email": "prof.smith@college.edu",
                "phone": "+1-555-0199",
                "department": "Computing & IT",
                "assigned_courses": [c_bct_id, c_bse_id],
                "assigned_units": [u_proj_id, u_cv_id],
                "created_at": now,
                "updated_at": now
            },
            {
                "user_id": lec2_uid,
                "staff_id": "LEC-CIT-002",
                "full_name": "Dr. Sarah Jones",
                "email": "dr.jones@college.edu",
                "phone": "+1-555-0288",
                "department": "Artificial Intelligence",
                "assigned_courses": [c_aids_id],
                "assigned_units": [str(units_inserted.inserted_ids[3])],
                "created_at": now,
                "updated_at": now
            }
        ])

        # Sample Students
        sample_students = [
            ("BCT/2026/001", "Alice Vance", "alice.vance@college.edu", c_bct_id),
            ("BCT/2026/002", "Bob Martinez", "bob.martinez@college.edu", c_bct_id),
            ("BCT/2026/003", "Charlie Davis", "charlie.davis@college.edu", c_bct_id),
            ("BSE/2026/010", "David Kim", "david.kim@college.edu", c_bse_id),
            ("BSE/2026/011", "Eva Rostova", "eva.rostova@college.edu", c_bse_id),
        ]

        import numpy as np
        for reg_no, full_name, email, cid in sample_students:
            await db.students.insert_one({
                "student_id": reg_no,
                "full_name": full_name,
                "email": email,
                "course_id": cid,
                "year": 3,
                "section": "A",
                "status": "ACTIVE",
                "face_enrollment_status": "ENROLLED",
                "enrolled_samples_count": 3,
                "created_at": now,
                "updated_at": now
            })
            base_v = np.random.randn(512).astype(np.float32)
            base_v /= np.linalg.norm(base_v)
            for s_idx in range(1, 4):
                noise = 0.96 * base_v + 0.04 * (np.random.randn(512).astype(np.float32) / 10.0)
                noise /= np.linalg.norm(noise)
                await db.face_embeddings.insert_one({
                    "student_id": reg_no,
                    "embedding": noise.tolist(),
                    "sample_index": s_idx,
                    "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "created_at": now,
                    "updated_at": now
                })

        logger.info("Auto-seeding completed successfully with Admin, Lecturers, and sample Students.")
    except Exception as e:
        logger.warning(f"Auto-seeding skipped or note: {e}")


async def close_mongo_connection():
    if db_manager.client:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()
        db_manager.client = None
        db_manager.db = None
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    if db_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_manager.db


async def ensure_database_indexes(db: AsyncIOMotorDatabase):
    """
    Creates critical and performance indexes across all MongoDB collections.
    Specifically guarantees duplicate attendance prevention at the database engine level.
    """
    try:
        # Critical constraint: Prevent duplicate student attendance per session
        await db.attendance_records.create_index(
            [("session_id", pymongo.ASCENDING), ("student_id", pymongo.ASCENDING)],
            unique=True,
            name="uniq_session_student_attendance"
        )
        await db.attendance_records.create_index([("session_id", pymongo.ASCENDING)])
        await db.attendance_records.create_index([("student_id", pymongo.ASCENDING)])
        await db.attendance_records.create_index([("marked_at", pymongo.DESCENDING)])

        # Users indexes
        await db.users.create_index([("email", pymongo.ASCENDING)], unique=True, name="uniq_user_email")
        await db.users.create_index([("role", pymongo.ASCENDING)])

        # Students indexes
        await db.students.create_index([("student_id", pymongo.ASCENDING)], unique=True, name="uniq_student_id")
        await db.students.create_index([("email", pymongo.ASCENDING)], unique=True, sparse=True, name="uniq_student_email")
        await db.students.create_index([("course_id", pymongo.ASCENDING)])
        await db.students.create_index([("face_enrollment_status", pymongo.ASCENDING)])

        # Lecturers indexes
        await db.lecturers.create_index([("user_id", pymongo.ASCENDING)], unique=True, name="uniq_lecturer_user_id")
        await db.lecturers.create_index([("staff_id", pymongo.ASCENDING)], unique=True, name="uniq_lecturer_staff_id")

        # Courses indexes
        await db.courses.create_index([("course_code", pymongo.ASCENDING)], unique=True, name="uniq_course_code")

        # Units indexes
        await db.units.create_index([("unit_code", pymongo.ASCENDING)], unique=True, name="uniq_unit_code")
        await db.units.create_index([("course_id", pymongo.ASCENDING)])

        # Venues indexes
        await db.venues.create_index([("venue_code", pymongo.ASCENDING)], unique=True, name="uniq_venue_code")

        # Enrollments indexes
        await db.enrollments.create_index(
            [("student_id", pymongo.ASCENDING), ("course_id", pymongo.ASCENDING)],
            unique=True,
            name="uniq_student_course_enrollment"
        )

        # Face Embeddings indexes
        await db.face_embeddings.create_index([("student_id", pymongo.ASCENDING)])
        await db.face_embeddings.create_index([("created_at", pymongo.DESCENDING)])

        # Attendance Sessions indexes
        await db.attendance_sessions.create_index([("status", pymongo.ASCENDING)])
        await db.attendance_sessions.create_index([("course_id", pymongo.ASCENDING)])
        await db.attendance_sessions.create_index([("unit_id", pymongo.ASCENDING)])
        await db.attendance_sessions.create_index([("lecturer_id", pymongo.ASCENDING)])
        await db.attendance_sessions.create_index([("created_at", pymongo.DESCENDING)])

        # Audit Logs indexes
        await db.audit_logs.create_index([("action", pymongo.ASCENDING)])
        await db.audit_logs.create_index([("user_id", pymongo.ASCENDING)])
        await db.audit_logs.create_index([("created_at", pymongo.DESCENDING)])

        # System Settings indexes
        await db.system_settings.create_index([("key", pymongo.ASCENDING)], unique=True, name="uniq_setting_key")

        logger.info("MongoDB database indexes successfully verified and ensured.")
    except Exception as e:
        logger.warning(f"Index creation note: {e}")
