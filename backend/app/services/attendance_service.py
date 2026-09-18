"""
Attendance Session Lifecycle and Real-Time Recognition Service
Enforces strict attendance business rules, duplicate prevention via MongoDB unique index,
and real-time frame evaluation.
"""

from datetime import datetime, timezone
import time
import uuid
from typing import Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import pymongo
from ..core.config import settings
from ..core.logging import logger
from ..models.attendance import (
    AttendanceRecordModel,
    AttendanceSessionModel,
    AttendanceStatus,
    SessionStatus
)
from ..schemas.attendance import (
    DetectedFaceResult,
    RecognizeFrameResponse,
    SessionCreate,
    SessionResponse
)
from ..utils.image_processing import decode_base64_to_image
from .face_engine import face_engine
from .face_recognition import recognition_index
from .liveness_service import liveness_service


class AttendanceService:
    async def create_session(
        self,
        db: AsyncIOMotorDatabase,
        lecturer_id: str,
        data: SessionCreate
    ) -> Dict:
        """Creates a new attendance session in CREATED state."""
        course = await db.courses.find_one({"_id": ObjectId(data.course_id)}) if ObjectId.is_valid(data.course_id) else await db.courses.find_one({"course_code": data.course_id})
        if not course:
            raise ValueError(f"Course '{data.course_id}' not found.")

        unit = await db.units.find_one({"_id": ObjectId(data.unit_id)}) if ObjectId.is_valid(data.unit_id) else await db.units.find_one({"unit_code": data.unit_id})
        if not unit:
            raise ValueError(f"Unit '{data.unit_id}' not found.")

        venue = await db.venues.find_one({"_id": ObjectId(data.venue_id)}) if ObjectId.is_valid(data.venue_id) else await db.venues.find_one({"venue_code": data.venue_id})
        if not venue:
            raise ValueError(f"Venue '{data.venue_id}' not found.")

        now = datetime.now(timezone.utc)
        code_suffix = uuid.uuid4().hex[:6].upper()
        session_code = f"SES-{now.strftime('%Y%m%d')}-{code_suffix}"

        session_doc = {
            "session_code": session_code,
            "course_id": str(course["_id"]),
            "unit_id": str(unit["_id"]),
            "venue_id": str(venue["_id"]),
            "lecturer_id": lecturer_id,
            "status": SessionStatus.CREATED,
            "started_at": None,
            "ended_at": None,
            "total_present": 0,
            "notes": data.notes,
            "created_at": now,
            "updated_at": now
        }
        res = await db.attendance_sessions.insert_one(session_doc)
        session_doc["_id"] = str(res.inserted_id)

        # Audit
        await db.audit_logs.insert_one({
            "user_id": lecturer_id,
            "action": "CREATE_ATTENDANCE_SESSION",
            "resource_type": "attendance_session",
            "resource_id": str(res.inserted_id),
            "details": {"session_code": session_code, "course_code": course.get("course_code")},
            "created_at": now,
            "updated_at": now
        })
        return session_doc

    async def start_session(
        self,
        db: AsyncIOMotorDatabase,
        session_id: str,
        acting_user_id: str
    ) -> Dict:
        """Transitions session to ACTIVE state."""
        filter_q = {"_id": ObjectId(session_id)} if ObjectId.is_valid(session_id) else {"session_code": session_id}
        session = await db.attendance_sessions.find_one(filter_q)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        if session["status"] == SessionStatus.COMPLETED:
            raise ValueError("Completed sessions cannot be restarted.")
        if session["status"] == SessionStatus.CANCELLED:
            raise ValueError("Cancelled sessions cannot be started.")

        now = datetime.now(timezone.utc)
        await db.attendance_sessions.update_one(
            {"_id": session["_id"]},
            {"$set": {"status": SessionStatus.ACTIVE, "started_at": now, "updated_at": now}}
        )
        session["status"] = SessionStatus.ACTIVE
        session["started_at"] = now

        # Ensure in-memory recognition index is ready
        if recognition_index.embeddings_matrix is None:
            await recognition_index.build_from_database(db)

        await db.audit_logs.insert_one({
            "user_id": acting_user_id,
            "action": "START_ATTENDANCE_SESSION",
            "resource_type": "attendance_session",
            "resource_id": str(session["_id"]),
            "details": {"started_at": now.isoformat()},
            "created_at": now,
            "updated_at": now
        })
        return session

    async def stop_session(
        self,
        db: AsyncIOMotorDatabase,
        session_id: str,
        acting_user_id: str
    ) -> Dict:
        """Transitions session to COMPLETED state and finalizes counts."""
        filter_q = {"_id": ObjectId(session_id)} if ObjectId.is_valid(session_id) else {"session_code": session_id}
        session = await db.attendance_sessions.find_one(filter_q)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        now = datetime.now(timezone.utc)
        total_present = await db.attendance_records.count_documents({"session_id": str(session["_id"])})

        await db.attendance_sessions.update_one(
            {"_id": session["_id"]},
            {
                "$set": {
                    "status": SessionStatus.COMPLETED,
                    "ended_at": now,
                    "total_present": total_present,
                    "updated_at": now
                }
            }
        )
        session["status"] = SessionStatus.COMPLETED
        session["ended_at"] = now
        session["total_present"] = total_present

        await db.audit_logs.insert_one({
            "user_id": acting_user_id,
            "action": "STOP_ATTENDANCE_SESSION",
            "resource_type": "attendance_session",
            "resource_id": str(session["_id"]),
            "details": {"total_present": total_present},
            "created_at": now,
            "updated_at": now
        })
        return session

    async def process_frame(
        self,
        db: AsyncIOMotorDatabase,
        session_id: str,
        image_base64: str
    ) -> RecognizeFrameResponse:
        """
        Main camera frame recognition workflow.
        Detects faces -> Matches against in-memory index -> Enforces duplicate prevention.
        """
        start_time = time.time()
        filter_q = {"_id": ObjectId(session_id)} if ObjectId.is_valid(session_id) else {"session_code": session_id}
        session = await db.attendance_sessions.find_one(filter_q)
        if not session:
            raise ValueError(f"Attendance session '{session_id}' not found.")

        if session["status"] != SessionStatus.ACTIVE:
            raise ValueError(
                f"Session is {session['status']}. Only ACTIVE sessions accept attendance records."
            )

        img_bgr = decode_base64_to_image(image_base64)
        if img_bgr is None:
            raise ValueError("Failed to decode image frame.")

        # Run face detection and ArcFace embedding
        detected_faces = face_engine.detect_and_extract(img_bgr)
        face_results: List[DetectedFaceResult] = []
        newly_marked_count = 0
        now = datetime.now(timezone.utc)
        str_session_id = str(session["_id"])

        for face in detected_faces:
            box = face["box"]
            embedding = face["embedding"]

            # Liveness evaluation
            liveness_res = liveness_service.evaluate_liveness(face)

            # Cosine similarity match against in-memory student index
            match = recognition_index.match_face(embedding)

            if not match.is_recognized or not match.student_id:
                # Unknown student: NEVER mark attendance
                face_results.append(
                    DetectedFaceResult(
                        box=box,
                        student_id=None,
                        student_name="UNKNOWN STUDENT",
                        registration_number=None,
                        similarity_score=match.similarity_score,
                        status="UNKNOWN",
                        is_live=liveness_res.is_live,
                        liveness_score=liveness_res.liveness_score
                    )
                )
                continue

            # Student recognized: Attempt to record attendance
            # Check for duplicate via database-level unique constraint
            attendance_doc = {
                "session_id": str_session_id,
                "student_id": match.student_id,
                "student_name": match.student_name,
                "course_id": session["course_id"],
                "unit_id": session["unit_id"],
                "venue_id": session["venue_id"],
                "lecturer_id": session["lecturer_id"],
                "status": AttendanceStatus.PRESENT,
                "marked_at": now,
                "similarity_score": match.similarity_score,
                "liveness_score": liveness_res.liveness_score,
                "verified_method": "INSIGHTFACE_ARCFACE",
                "created_at": now,
                "updated_at": now
            }

            try:
                await db.attendance_records.insert_one(attendance_doc)
                newly_marked_count += 1
                await db.attendance_sessions.update_one(
                    {"_id": session["_id"]},
                    {"$inc": {"total_present": 1}, "$set": {"updated_at": now}}
                )
                face_status = "NEW_PRESENT"
            except pymongo.errors.DuplicateKeyError:
                face_status = "ALREADY_MARKED"

            face_results.append(
                DetectedFaceResult(
                    box=box,
                    student_id=match.student_id,
                    student_name=match.student_name,
                    registration_number=match.registration_number,
                    similarity_score=match.similarity_score,
                    status=face_status,
                    is_live=liveness_res.is_live,
                    liveness_score=liveness_res.liveness_score
                )
            )

        # Retrieve current total present
        total_present = await db.attendance_records.count_documents({"session_id": str_session_id})
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return RecognizeFrameResponse(
            session_id=str_session_id,
            faces=face_results,
            total_present=total_present,
            newly_marked_count=newly_marked_count,
            processing_time_ms=elapsed_ms
        )


attendance_service = AttendanceService()
