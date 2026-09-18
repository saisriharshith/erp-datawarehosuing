"""
Lecturer Management API Endpoints
"""

from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...core.security import get_password_hash
from ...models.user import UserModel, UserRole
from ...schemas.lecturer import LecturerCreate, LecturerResponse, LecturerUpdate
from ..deps import get_current_user, get_db, require_admin, require_lecturer_or_admin

router = APIRouter(prefix="/lecturers", tags=["Lecturers"])


@router.get("", response_model=List[LecturerResponse])
async def list_lecturers(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Lists all registered lecturers."""
    cursor = db.lecturers.find().sort("created_at", -1)
    docs = await cursor.to_list(1000)

    # Pre-cache courses and units for descriptive names
    courses = {str(c["_id"]): c.get("course_code") for c in await db.courses.find().to_list(1000)}
    units = {str(u["_id"]): f"{u.get('unit_code')} - {u.get('name')}" for u in await db.units.find().to_list(1000)}

    results = []
    for d in docs:
        c_names = [courses.get(cid, cid) for cid in d.get("assigned_courses", [])]
        u_names = [units.get(uid, uid) for uid in d.get("assigned_units", [])]
        results.append(
            LecturerResponse(
                id=str(d["_id"]),
                user_id=d["user_id"],
                staff_id=d["staff_id"],
                full_name=d["full_name"],
                email=d["email"],
                phone=d.get("phone"),
                department=d.get("department", "Computing"),
                assigned_courses=d.get("assigned_courses", []),
                assigned_units=d.get("assigned_units", []),
                assigned_course_names=c_names,
                assigned_unit_names=u_names,
                created_at=d.get("created_at", datetime.now(timezone.utc))
            )
        )
    return results


@router.get("/me/assignments")
async def get_my_assignments(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Lecturer endpoint to retrieve their assigned courses, units, and available venues."""
    lecturer = await db.lecturers.find_one({"user_id": current_user.id})
    assigned_course_ids = lecturer.get("assigned_courses", []) if lecturer else []
    assigned_unit_ids = lecturer.get("assigned_units", []) if lecturer else []

    # If Admin, allow all courses and units
    if current_user.role == UserRole.ADMIN:
        courses = await db.courses.find({"is_active": True}).to_list(100)
        units = await db.units.find({"is_active": True}).to_list(200)
    else:
        c_oids = [ObjectId(cid) for cid in assigned_course_ids if ObjectId.is_valid(cid)]
        u_oids = [ObjectId(uid) for uid in assigned_unit_ids if ObjectId.is_valid(uid)]
        courses = await db.courses.find({"_id": {"$in": c_oids}}).to_list(100) if c_oids else []
        units = await db.units.find({"_id": {"$in": u_oids}}).to_list(200) if u_oids else []

    venues = await db.venues.find({"is_active": True}).to_list(100)

    return {
        "courses": [{"id": str(c["_id"]), "code": c["course_code"], "title": c["title"]} for c in courses],
        "units": [{"id": str(u["_id"]), "code": u["unit_code"], "name": u["name"], "course_id": u["course_id"]} for u in units],
        "venues": [{"id": str(v["_id"]), "code": v["venue_code"], "name": v["name"], "capacity": v["capacity"]} for v in venues]
    }


@router.post("", response_model=LecturerResponse, status_code=status.HTTP_201_CREATED)
async def create_lecturer(
    data: LecturerCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Registers a new lecturer user account and faculty profile."""
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    existing_staff = await db.lecturers.find_one({"staff_id": data.staff_id})
    if existing_staff:
        raise HTTPException(status_code=400, detail="Staff ID already assigned.")

    now = datetime.now(timezone.utc)
    # Create Auth User
    user_doc = {
        "email": data.email.lower(),
        "hashed_password": get_password_hash(data.password),
        "full_name": data.full_name,
        "role": UserRole.LECTURER,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    user_res = await db.users.insert_one(user_doc)
    user_id = str(user_res.inserted_id)

    # Create Lecturer Profile
    lecturer_doc = {
        "user_id": user_id,
        "staff_id": data.staff_id,
        "full_name": data.full_name,
        "email": data.email.lower(),
        "phone": data.phone,
        "department": data.department,
        "assigned_courses": data.assigned_courses,
        "assigned_units": data.assigned_units,
        "created_at": now,
        "updated_at": now
    }
    lec_res = await db.lecturers.insert_one(lecturer_doc)

    await db.audit_logs.insert_one({
        "user_id": admin.id,
        "action": "CREATE_LECTURER",
        "resource_type": "lecturer",
        "resource_id": str(lec_res.inserted_id),
        "details": {"staff_id": data.staff_id, "email": data.email},
        "created_at": now,
        "updated_at": now
    })

    return LecturerResponse(
        id=str(lec_res.inserted_id),
        user_id=user_id,
        staff_id=data.staff_id,
        full_name=data.full_name,
        email=data.email.lower(),
        phone=data.phone,
        department=data.department,
        assigned_courses=data.assigned_courses,
        assigned_units=data.assigned_units,
        assigned_course_names=[],
        assigned_unit_names=[],
        created_at=now
    )


@router.put("/{lecturer_id}", response_model=LecturerResponse)
async def update_lecturer(
    lecturer_id: str,
    data: LecturerUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Updates lecturer assignments and details."""
    filter_q = {"_id": ObjectId(lecturer_id)} if ObjectId.is_valid(lecturer_id) else {"staff_id": lecturer_id}
    lec = await db.lecturers.find_one(filter_q)
    if not lec:
        raise HTTPException(status_code=404, detail="Lecturer not found.")

    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.lecturers.update_one({"_id": lec["_id"]}, {"$set": update_dict})
    if "full_name" in update_dict:
        await db.users.update_one({"_id": ObjectId(lec["user_id"])}, {"$set": {"full_name": update_dict["full_name"]}})

    updated = await db.lecturers.find_one({"_id": lec["_id"]})
    return LecturerResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        staff_id=updated["staff_id"],
        full_name=updated["full_name"],
        email=updated["email"],
        phone=updated.get("phone"),
        department=updated.get("department", ""),
        assigned_courses=updated.get("assigned_courses", []),
        assigned_units=updated.get("assigned_units", []),
        assigned_course_names=[],
        assigned_unit_names=[],
        created_at=updated.get("created_at")
    )
