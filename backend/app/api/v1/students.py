"""
Student Management API Endpoints
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...models.student import EnrollmentStatus, StudentModel, StudentStatus
from ...models.user import UserModel
from ...schemas.student import (
    StudentCreate,
    StudentDetailResponse,
    StudentListResponse,
    StudentResponse,
    StudentUpdate
)
from ...services.face_enrollment_service import face_enrollment_service
from ..deps import get_current_user, get_db, require_admin, require_lecturer_or_admin

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=StudentListResponse)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    course_id: Optional[str] = None,
    enrollment_status: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Lists students with optional search and filters."""
    query = {}
    if search:
        query["$or"] = [
            {"student_id": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if course_id:
        query["course_id"] = course_id
    if enrollment_status:
        query["face_enrollment_status"] = enrollment_status

    total = await db.students.count_documents(query)
    skip = (page - 1) * page_size
    cursor = db.students.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    docs = await cursor.to_list(length=page_size)

    # Pre-cache courses
    courses = {str(c["_id"]): c for c in await db.courses.find().to_list(1000)}

    items = []
    for d in docs:
        cid = d.get("course_id", "")
        course = courses.get(cid, {})
        items.append(
            StudentResponse(
                id=str(d["_id"]),
                student_id=d["student_id"],
                full_name=d["full_name"],
                email=d["email"],
                phone=d.get("phone"),
                gender=d.get("gender"),
                course_id=cid,
                course_code=course.get("course_code"),
                course_title=course.get("title"),
                year=d.get("year", 1),
                section=d.get("section", "A"),
                status=d.get("status", StudentStatus.ACTIVE),
                face_enrollment_status=d.get("face_enrollment_status", EnrollmentStatus.PENDING),
                enrolled_samples_count=d.get("enrolled_samples_count", 0),
                primary_photo_url=d.get("primary_photo_url"),
                created_at=d.get("created_at", datetime.now(timezone.utc))
            )
        )

    return StudentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Registers a new student. Enforces unique registration number and email."""
    existing = await db.students.find_one({
        "$or": [{"student_id": data.student_id}, {"email": data.email.lower()}]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A student with ID '{data.student_id}' or email '{data.email}' already exists."
        )

    now = datetime.now(timezone.utc)
    student_doc = {
        "student_id": data.student_id.strip(),
        "full_name": data.full_name.strip(),
        "email": data.email.lower(),
        "phone": data.phone,
        "gender": data.gender,
        "course_id": data.course_id,
        "year": data.year,
        "section": data.section,
        "status": StudentStatus.ACTIVE,
        "face_enrollment_status": EnrollmentStatus.PENDING,
        "enrolled_samples_count": 0,
        "primary_photo_url": None,
        "created_at": now,
        "updated_at": now
    }
    res = await db.students.insert_one(student_doc)
    student_doc["_id"] = str(res.inserted_id)

    # Fetch course code for response
    course = await db.courses.find_one({"_id": ObjectId(data.course_id)}) if ObjectId.is_valid(data.course_id) else None

    # Audit log
    await db.audit_logs.insert_one({
        "user_id": admin.id,
        "action": "CREATE_STUDENT",
        "resource_type": "student",
        "resource_id": str(res.inserted_id),
        "details": {"student_id": data.student_id, "name": data.full_name},
        "created_at": now,
        "updated_at": now
    })

    return StudentResponse(
        id=student_doc["_id"],
        student_id=student_doc["student_id"],
        full_name=student_doc["full_name"],
        email=student_doc["email"],
        phone=student_doc["phone"],
        gender=student_doc["gender"],
        course_id=student_doc["course_id"],
        course_code=course.get("course_code") if course else None,
        course_title=course.get("title") if course else None,
        year=student_doc["year"],
        section=student_doc["section"],
        status=student_doc["status"],
        face_enrollment_status=student_doc["face_enrollment_status"],
        enrolled_samples_count=student_doc["enrolled_samples_count"],
        primary_photo_url=student_doc["primary_photo_url"],
        created_at=student_doc["created_at"]
    )


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student_profile(
    student_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Retrieves full student profile including attendance percentage and enrolled photos."""
    filter_q = {"_id": ObjectId(student_id)} if ObjectId.is_valid(student_id) else {"student_id": student_id}
    student = await db.students.find_one(filter_q)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    sid = student["student_id"]
    course = await db.courses.find_one({"_id": ObjectId(student["course_id"])}) if ObjectId.is_valid(student["course_id"]) else None

    # Attendance stats
    total_classes = await db.attendance_sessions.count_documents({"course_id": student["course_id"]})
    attended_classes = await db.attendance_records.count_documents({"student_id": sid})
    percentage = round((attended_classes / max(1, total_classes)) * 100.0, 1) if total_classes > 0 else 0.0

    # Enrolled photo URLs from ImageKit
    samples_cursor = db.face_embeddings.find({"student_id": sid}).sort("sample_index", 1)
    samples = await samples_cursor.to_list(50)
    photos = [s["imagekit_url"] for s in samples if s.get("imagekit_url")]

    return StudentDetailResponse(
        id=str(student["_id"]),
        student_id=student["student_id"],
        full_name=student["full_name"],
        email=student["email"],
        phone=student.get("phone"),
        gender=student.get("gender"),
        course_id=student["course_id"],
        course_code=course.get("course_code") if course else None,
        course_title=course.get("title") if course else None,
        year=student.get("year", 1),
        section=student.get("section", "A"),
        status=student.get("status", StudentStatus.ACTIVE),
        face_enrollment_status=student.get("face_enrollment_status", EnrollmentStatus.PENDING),
        enrolled_samples_count=student.get("enrolled_samples_count", len(samples)),
        primary_photo_url=student.get("primary_photo_url"),
        created_at=student.get("created_at", datetime.now(timezone.utc)),
        attendance_percentage=min(100.0, percentage),
        total_classes=total_classes,
        attended_classes=attended_classes,
        enrolled_photos=photos
    )


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    data: StudentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Updates student information."""
    filter_q = {"_id": ObjectId(student_id)} if ObjectId.is_valid(student_id) else {"student_id": student_id}
    student = await db.students.find_one(filter_q)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.students.update_one({"_id": student["_id"]}, {"$set": update_dict})
    updated = await db.students.find_one({"_id": student["_id"]})

    course = await db.courses.find_one({"_id": ObjectId(updated["course_id"])}) if ObjectId.is_valid(updated["course_id"]) else None

    return StudentResponse(
        id=str(updated["_id"]),
        student_id=updated["student_id"],
        full_name=updated["full_name"],
        email=updated["email"],
        phone=updated.get("phone"),
        gender=updated.get("gender"),
        course_id=updated["course_id"],
        course_code=course.get("course_code") if course else None,
        course_title=course.get("title") if course else None,
        year=updated.get("year", 1),
        section=updated.get("section", "A"),
        status=updated.get("status", StudentStatus.ACTIVE),
        face_enrollment_status=updated.get("face_enrollment_status", EnrollmentStatus.PENDING),
        enrolled_samples_count=updated.get("enrolled_samples_count", 0),
        primary_photo_url=updated.get("primary_photo_url"),
        created_at=updated.get("created_at")
    )


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Deletes student record and purges biometric embeddings."""
    filter_q = {"_id": ObjectId(student_id)} if ObjectId.is_valid(student_id) else {"student_id": student_id}
    student = await db.students.find_one(filter_q)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    sid = student["student_id"]
    await face_enrollment_service.delete_student_enrollment(db, sid, admin.id)
    await db.students.delete_one({"_id": student["_id"]})

    await db.audit_logs.insert_one({
        "user_id": admin.id,
        "action": "DELETE_STUDENT",
        "resource_type": "student",
        "resource_id": str(student["_id"]),
        "details": {"student_id": sid},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })
