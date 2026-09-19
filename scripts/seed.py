"""
Development Database Seed Script
Populates MongoDB with comprehensive academic, user, student, and attendance data.

WARNING:
All credentials generated here are strictly for DEVELOPMENT AND TESTING ONLY.
NEVER use these credentials in a production environment.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import os
import sys
from bson import ObjectId
import numpy as np

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.config import settings
from backend.app.core.database import connect_to_mongo, close_mongo_connection, get_database
from backend.app.core.security import get_password_hash
from backend.app.core.logging import logger
from backend.app.models.user import UserRole
from backend.app.models.student import StudentStatus, EnrollmentStatus
from backend.app.models.attendance import SessionStatus, AttendanceStatus


async def seed_database():
    logger.info("Initializing database connection for seeding...")
    await connect_to_mongo()
    db = get_database()

    logger.info("Clearing existing collections...")
    collections = [
        "users", "students", "lecturers", "courses", "units",
        "venues", "enrollments", "face_embeddings", "attendance_sessions",
        "attendance_records", "audit_logs", "system_settings"
    ]
    for col in collections:
        await db[col].delete_many({})

    now = datetime.now(timezone.utc)

    # 1. Admin User (DEVELOPMENT ONLY)
    logger.info("Seeding Admin user...")
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
    admin_res = await db.users.insert_one(admin_doc)
    admin_id = str(admin_res.inserted_id)

    # 2. Lecturer Users (DEVELOPMENT ONLY)
    logger.info("Seeding Lecturer users...")
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

    # 3. Courses
    logger.info("Seeding Courses...")
    courses_data = [
        {"course_code": "BCT", "title": "Computer Technology", "department": "Computing & IT", "credits": 4, "duration_years": 4, "is_active": True, "created_at": now, "updated_at": now},
        {"course_code": "BSE", "title": "Software Engineering", "department": "Computing & IT", "credits": 4, "duration_years": 4, "is_active": True, "created_at": now, "updated_at": now},
        {"course_code": "AIDS", "title": "AI & Data Science", "department": "Artificial Intelligence", "credits": 4, "duration_years": 4, "is_active": True, "created_at": now, "updated_at": now},
    ]
    courses_inserted = await db.courses.insert_many(courses_data)
    c_bct_id = str(courses_inserted.inserted_ids[0])
    c_bse_id = str(courses_inserted.inserted_ids[1])
    c_aids_id = str(courses_inserted.inserted_ids[2])

    # 4. Units / Subjects
    logger.info("Seeding Units...")
    units_data = [
        {"unit_code": "BCT 2411", "name": "Project Implementation", "course_id": c_bct_id, "credit_hours": 3, "description": "Hands-on project development", "is_active": True, "created_at": now, "updated_at": now},
        {"unit_code": "CS 3102", "name": "Computer Vision & ML", "course_id": c_bct_id, "credit_hours": 4, "description": "Image processing and deep learning", "is_active": True, "created_at": now, "updated_at": now},
        {"unit_code": "SE 2201", "name": "Cloud Computing Architecture", "course_id": c_bse_id, "credit_hours": 3, "description": "Microservices and cloud infrastructure", "is_active": True, "created_at": now, "updated_at": now},
        {"unit_code": "AI 4101", "name": "Deep Neural Networks", "course_id": c_aids_id, "credit_hours": 4, "description": "Advanced convolutional and transformer networks", "is_active": True, "created_at": now, "updated_at": now},
    ]
    units_inserted = await db.units.insert_many(units_data)
    u_proj_id = str(units_inserted.inserted_ids[0])
    u_cv_id = str(units_inserted.inserted_ids[1])
    u_cloud_id = str(units_inserted.inserted_ids[2])
    u_deep_id = str(units_inserted.inserted_ids[3])

    # 5. Venues
    logger.info("Seeding Venues...")
    venues_data = [
        {"venue_code": "LH-101", "name": "Lecture Hall 101", "building": "Engineering Block A", "room_number": "101", "capacity": 60, "venue_type": "LECTURE_HALL", "is_active": True, "created_at": now, "updated_at": now},
        {"venue_code": "LAB-B34", "name": "Turing Vision Lab", "building": "Computing Complex", "room_number": "B34", "capacity": 45, "venue_type": "LABORATORY", "is_active": True, "created_at": now, "updated_at": now},
        {"venue_code": "SR-202", "name": "Seminar Hall 202", "building": "Research Tower", "room_number": "202", "capacity": 30, "venue_type": "SEMINAR_ROOM", "is_active": True, "created_at": now, "updated_at": now},
    ]
    venues_inserted = await db.venues.insert_many(venues_data)
    v_lh_id = str(venues_inserted.inserted_ids[0])
    v_lab_id = str(venues_inserted.inserted_ids[1])
    v_sr_id = str(venues_inserted.inserted_ids[2])

    # 6. Lecturer Profiles
    logger.info("Seeding Lecturer profiles...")
    lec1_profile = {
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
    }
    await db.lecturers.insert_one(lec1_profile)

    lec2_profile = {
        "user_id": lec2_uid,
        "staff_id": "LEC-CIT-002",
        "full_name": "Dr. Sarah Jones",
        "email": "dr.jones@college.edu",
        "phone": "+1-555-0288",
        "department": "Artificial Intelligence",
        "assigned_courses": [c_aids_id],
        "assigned_units": [u_deep_id],
        "created_at": now,
        "updated_at": now
    }
    await db.lecturers.insert_one(lec2_profile)

    # 7. Students & Face Embeddings
    logger.info("Seeding Students and synthetic embeddings...")
    sample_students = [
        ("BCT/2026/001", "Alice Vance", "alice.vance@college.edu", c_bct_id),
        ("BCT/2026/002", "Bob Martinez", "bob.martinez@college.edu", c_bct_id),
        ("BCT/2026/003", "Charlie Davis", "charlie.davis@college.edu", c_bct_id),
        ("BCT/2026/004", "Diana Prince", "diana.prince@college.edu", c_bct_id),
        ("BCT/2026/005", "Ethan Hunt", "ethan.hunt@college.edu", c_bct_id),
        ("BSE/2026/010", "Fiona Gallagher", "fiona.g@college.edu", c_bse_id),
        ("BSE/2026/011", "George Clark", "george.c@college.edu", c_bse_id),
        ("AIDS/2026/020", "Hannah Abbott", "hannah.a@college.edu", c_aids_id),
        ("AIDS/2026/021", "Ian Malcolm", "ian.m@college.edu", c_aids_id),
        ("AIDS/2026/022", "Julia Roberts", "julia.r@college.edu", c_aids_id),
    ]

    np.random.seed(42)  # For deterministic vector matching during tests

    student_records = []
    for i, (reg, name, email, course_id) in enumerate(sample_students):
        # First 4 students are enrolled with 5 face samples each
        is_enrolled = i < 4
        sample_count = 5 if is_enrolled else 0
        status_enr = EnrollmentStatus.ENROLLED if is_enrolled else EnrollmentStatus.PENDING
        avatar = f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" if is_enrolled else None

        s_doc = {
            "student_id": reg,
            "full_name": name,
            "email": email,
            "phone": f"+1-555-0{300 + i}",
            "gender": "Female" if i % 2 == 0 else "Male",
            "course_id": course_id,
            "year": 2,
            "section": "A",
            "status": StudentStatus.ACTIVE,
            "face_enrollment_status": status_enr,
            "enrolled_samples_count": sample_count,
            "primary_photo_url": avatar,
            "created_at": now - timedelta(days=20),
            "updated_at": now
        }
        res = await db.students.insert_one(s_doc)
        student_records.append(s_doc)

        if is_enrolled:
            # Generate 5 cluster vectors with slight variance
            base_vec = np.random.randn(512).astype(np.float32)
            base_vec = base_vec / np.linalg.norm(base_vec)

            for s_idx in range(1, 6):
                perturb = base_vec + (np.random.randn(512).astype(np.float32) * 0.05)
                norm_vec = (perturb / np.linalg.norm(perturb)).tolist()

                emb_doc = {
                    "student_id": reg,
                    "embedding": norm_vec,
                    "imagekit_file_id": f"ik_seed_{reg.replace('/', '_')}_{s_idx}",
                    "imagekit_url": f"https://ik.imagekit.io/mock/students/{reg.replace('/', '_')}_sample_{s_idx}.jpg",
                    "model": "buffalo_sc",
                    "model_version": "arcface_v2_sc",
                    "quality_score": 92.5,
                    "sample_index": s_idx,
                    "created_at": now - timedelta(days=15),
                    "updated_at": now - timedelta(days=15)
                }
                await db.face_embeddings.insert_one(emb_doc)

    # 8. Historical Attendance Sessions and Records (for rich charts)
    logger.info("Seeding historical attendance sessions and records...")
    for day_offset in range(7, 0, -1):
        session_dt = now - timedelta(days=day_offset)
        s_code = f"SES-{session_dt.strftime('%Y%m%d')}-01"

        sess_doc = {
            "session_code": s_code,
            "course_id": c_bct_id,
            "unit_id": u_proj_id,
            "venue_id": v_lab_id,
            "lecturer_id": lec1_uid,
            "status": SessionStatus.COMPLETED,
            "started_at": session_dt.replace(hour=10, minute=0, second=0),
            "ended_at": session_dt.replace(hour=11, minute=30, second=0),
            "total_present": 4,
            "notes": "Regular practical lab attendance",
            "created_at": session_dt.replace(hour=9, minute=55),
            "updated_at": session_dt.replace(hour=11, minute=30)
        }
        s_res = await db.attendance_sessions.insert_one(sess_doc)
        sid = str(s_res.inserted_id)

        # Mark 4 enrolled students present
        for st in student_records[:4]:
            rec_doc = {
                "session_id": sid,
                "student_id": st["student_id"],
                "student_name": st["full_name"],
                "course_id": c_bct_id,
                "unit_id": u_proj_id,
                "venue_id": v_lab_id,
                "lecturer_id": lec1_uid,
                "status": AttendanceStatus.PRESENT,
                "marked_at": session_dt.replace(hour=10, minute=5 + (len(sid) % 10)),
                "similarity_score": round(0.85 + (np.random.rand() * 0.12), 4),
                "liveness_score": 0.96,
                "verified_method": "INSIGHTFACE_ARCFACE",
                "created_at": session_dt.replace(hour=10, minute=5),
                "updated_at": session_dt.replace(hour=10, minute=5)
            }
            await db.attendance_records.insert_one(rec_doc)

    # 9. Today's Active Session for Instant Testing
    logger.info("Seeding Today's Active Session...")
    today_sess = {
        "session_code": f"SES-{now.strftime('%Y%m%d')}-LIVE",
        "course_id": c_bct_id,
        "unit_id": u_cv_id,
        "venue_id": v_lab_id,
        "lecturer_id": lec1_uid,
        "status": SessionStatus.ACTIVE,
        "started_at": now - timedelta(minutes=15),
        "ended_at": None,
        "total_present": 2,
        "notes": "Live Computer Vision lecture session",
        "created_at": now - timedelta(minutes=20),
        "updated_at": now
    }
    today_res = await db.attendance_sessions.insert_one(today_sess)
    today_sid = str(today_res.inserted_id)

    # Mark 2 students already present in today's active session
    for st in student_records[:2]:
        rec_doc = {
            "session_id": today_sid,
            "student_id": st["student_id"],
            "student_name": st["full_name"],
            "course_id": c_bct_id,
            "unit_id": u_cv_id,
            "venue_id": v_lab_id,
            "lecturer_id": lec1_uid,
            "status": AttendanceStatus.PRESENT,
            "marked_at": now - timedelta(minutes=10),
            "similarity_score": 0.91,
            "liveness_score": 0.98,
            "verified_method": "INSIGHTFACE_ARCFACE",
            "created_at": now - timedelta(minutes=10),
            "updated_at": now - timedelta(minutes=10)
        }
        await db.attendance_records.insert_one(rec_doc)

    # 10. Audit Log
    await db.audit_logs.insert_one({
        "user_id": admin_id,
        "user_email": "admin@college.edu",
        "user_role": UserRole.ADMIN,
        "action": "SYSTEM_SEED_INITIALIZED",
        "resource_type": "database",
        "details": {
            "students_count": len(sample_students),
            "courses_count": len(courses_data),
            "units_count": len(units_data)
        },
        "created_at": now,
        "updated_at": now
    })

    logger.info("==================================================")
    logger.info("SEED DATA COMPLETED SUCCESSFULLY!")
    logger.info("==================================================")
    logger.info("DEVELOPMENT CREDENTIALS:")
    logger.info("  Admin:     admin@college.edu       / Admin@12345")
    logger.info("  Lecturer1: prof.smith@college.edu  / Lecturer@12345")
    logger.info("  Lecturer2: dr.jones@college.edu    / Lecturer@12345")
    logger.info("  Active Session ID: " + today_sid)
    logger.info("==================================================")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed_database())
