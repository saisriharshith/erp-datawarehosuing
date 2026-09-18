"""
Attendance Sessions, Real-Time Recognition, and Records Endpoints
"""

from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...models.user import UserModel, UserRole
from ...schemas.attendance import (
    AttendanceRecordResponse,
    RecognizeFrameRequest,
    RecognizeFrameResponse,
    SessionCreate,
    SessionResponse,
    SessionUpdate
)
from ...services.attendance_service import attendance_service
from ..deps import get_current_user, get_db, require_lecturer_or_admin

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance_session(
    data: SessionCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Creates a new attendance session in CREATED state."""
    try:
        session = await attendance_service.create_session(
            db=db,
            lecturer_id=current_user.id,
            data=data
        )
        return await _format_session_response(db, session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/start", response_model=SessionResponse)
async def start_attendance_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Starts the attendance session, enabling live camera recognition."""
    try:
        session = await attendance_service.start_session(db, session_id, current_user.id)
        return await _format_session_response(db, session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/stop", response_model=SessionResponse)
async def stop_attendance_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Stops the session and marks it COMPLETED."""
    try:
        session = await attendance_service.stop_session(db, session_id, current_user.id)
        return await _format_session_response(db, session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/recognize", response_model=RecognizeFrameResponse)
async def recognize_and_record_attendance(
    session_id: str,
    data: RecognizeFrameRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """
    Ingests live camera video frame from frontend.
    Runs InsightFace detection + ArcFace feature extraction + cosine similarity matching.
    Atomically records attendance with duplicate prevention at DB level.
    """
    try:
        return await attendance_service.process_frame(
            db=db,
            session_id=session_id,
            image_base64=data.image_base64
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@router.get("/sessions", response_model=List[SessionResponse])
async def list_attendance_sessions(
    status_filter: Optional[str] = Query(None, alias="status"),
    course_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Lists attendance sessions with optional filters."""
    query = {}
    if status_filter:
        query["status"] = status_filter
    if course_id:
        query["course_id"] = course_id
    if unit_id:
        query["unit_id"] = unit_id
    if current_user.role == UserRole.LECTURER:
        query["lecturer_id"] = current_user.id

    cursor = db.attendance_sessions.find(query).sort("created_at", -1).limit(100)
    sessions = await cursor.to_list(100)

    results = []
    for s in sessions:
        results.append(await _format_session_response(db, s))
    return results


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session_detail(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Retrieves detailed session state."""
    filter_q = {"_id": ObjectId(session_id)} if ObjectId.is_valid(session_id) else {"session_code": session_id}
    session = await db.attendance_sessions.find_one(filter_q)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return await _format_session_response(db, session)


@router.get("/sessions/{session_id}/records", response_model=List[AttendanceRecordResponse])
async def get_session_attendance_records(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Returns all attendance records marked for this session."""
    filter_q = {"_id": ObjectId(session_id)} if ObjectId.is_valid(session_id) else {"session_code": session_id}
    session = await db.attendance_sessions.find_one(filter_q)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    sid = str(session["_id"])
    cursor = db.attendance_records.find({"session_id": sid}).sort("marked_at", -1)
    records = await cursor.to_list(1000)

    students = {s["student_id"]: s for s in await db.students.find().to_list(5000)}

    output = []
    for r in records:
        st = students.get(r["student_id"], {})
        output.append(
            AttendanceRecordResponse(
                id=str(r["_id"]),
                session_id=sid,
                student_id=r["student_id"],
                student_name=r.get("student_name") or st.get("full_name", "Student"),
                student_registration_number=r["student_id"],
                course_id=r.get("course_id", ""),
                unit_id=r.get("unit_id", ""),
                venue_id=r.get("venue_id", ""),
                lecturer_id=r.get("lecturer_id", ""),
                status=r.get("status", "PRESENT"),
                marked_at=r["marked_at"],
                similarity_score=r.get("similarity_score", 1.0),
                liveness_score=r.get("liveness_score"),
                verified_method=r.get("verified_method", "INSIGHTFACE_ARCFACE")
            )
        )
    return output


async def _format_session_response(db: AsyncIOMotorDatabase, session: dict) -> SessionResponse:
    """Helper to populate relational metadata into session response."""
    cid = session.get("course_id", "")
    uid = session.get("unit_id", "")
    vid = session.get("venue_id", "")
    lid = session.get("lecturer_id", "")

    course = await db.courses.find_one({"_id": ObjectId(cid)}) if ObjectId.is_valid(cid) else None
    unit = await db.units.find_one({"_id": ObjectId(uid)}) if ObjectId.is_valid(uid) else None
    venue = await db.venues.find_one({"_id": ObjectId(vid)}) if ObjectId.is_valid(vid) else None
    lecturer = await db.users.find_one({"_id": ObjectId(lid)}) if ObjectId.is_valid(lid) else None

    # Count actual present from records
    present_count = await db.attendance_records.count_documents({"session_id": str(session["_id"])})

    return SessionResponse(
        id=str(session["_id"]),
        session_code=session["session_code"],
        course_id=cid,
        course_code=course.get("course_code") if course else None,
        course_title=course.get("title") if course else None,
        unit_id=uid,
        unit_code=unit.get("unit_code") if unit else None,
        unit_name=unit.get("name") if unit else None,
        venue_id=vid,
        venue_code=venue.get("venue_code") if venue else None,
        venue_name=venue.get("name") if venue else None,
        lecturer_id=lid,
        lecturer_name=lecturer.get("full_name") if lecturer else None,
        status=session.get("status", "CREATED"),
        started_at=session.get("started_at"),
        ended_at=session.get("ended_at"),
        total_present=present_count,
        notes=session.get("notes"),
        created_at=session.get("created_at")
    )
