"""
Academic Structure Management Endpoints: Courses, Units, and Venues
"""

from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...models.academic import CourseModel, UnitModel, VenueModel
from ...models.user import UserModel
from ...schemas.academic import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    UnitCreate,
    UnitResponse,
    UnitUpdate,
    VenueCreate,
    VenueResponse,
    VenueUpdate
)
from ..deps import get_db, require_admin, require_lecturer_or_admin

router = APIRouter(tags=["Academic Management"])


# ==========================================
# Courses API
# ==========================================
@router.get("/courses", response_model=List[CourseResponse])
async def list_courses(
    active_only: bool = False,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Lists courses with count of units and enrolled students."""
    query = {"is_active": True} if active_only else {}
    cursor = db.courses.find(query).sort("course_code", 1)
    courses = await cursor.to_list(500)

    results = []
    for c in courses:
        cid = str(c["_id"])
        units_count = await db.units.count_documents({"course_id": cid})
        students_count = await db.students.count_documents({"course_id": cid})
        results.append(
            CourseResponse(
                id=cid,
                course_code=c["course_code"],
                title=c["title"],
                department=c.get("department", "Computing"),
                credits=c.get("credits", 4),
                duration_years=c.get("duration_years", 4),
                is_active=c.get("is_active", True),
                units_count=units_count,
                enrolled_students_count=students_count,
                created_at=c.get("created_at", datetime.now(timezone.utc))
            )
        )
    return results


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Creates a new degree course."""
    existing = await db.courses.find_one({"course_code": data.course_code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail=f"Course code '{data.course_code}' already exists.")

    now = datetime.now(timezone.utc)
    course_doc = {
        "course_code": data.course_code.upper().strip(),
        "title": data.title.strip(),
        "department": data.department.strip(),
        "credits": data.credits,
        "duration_years": data.duration_years,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    res = await db.courses.insert_one(course_doc)
    course_doc["_id"] = str(res.inserted_id)

    return CourseResponse(
        id=course_doc["_id"],
        course_code=course_doc["course_code"],
        title=course_doc["title"],
        department=course_doc["department"],
        credits=course_doc["credits"],
        duration_years=course_doc["duration_years"],
        is_active=True,
        units_count=0,
        enrolled_students_count=0,
        created_at=now
    )


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Updates course details."""
    filter_q = {"_id": ObjectId(course_id)} if ObjectId.is_valid(course_id) else {"course_code": course_id}
    course = await db.courses.find_one(filter_q)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    await db.courses.update_one({"_id": course["_id"]}, {"$set": update_dict})
    updated = await db.courses.find_one({"_id": course["_id"]})
    cid = str(updated["_id"])

    return CourseResponse(
        id=cid,
        course_code=updated["course_code"],
        title=updated["title"],
        department=updated["department"],
        credits=updated["credits"],
        duration_years=updated["duration_years"],
        is_active=updated["is_active"],
        units_count=await db.units.count_documents({"course_id": cid}),
        enrolled_students_count=await db.students.count_documents({"course_id": cid}),
        created_at=updated.get("created_at")
    )


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Deletes course if no students or units are attached."""
    filter_q = {"_id": ObjectId(course_id)} if ObjectId.is_valid(course_id) else {"course_code": course_id}
    course = await db.courses.find_one(filter_q)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    cid = str(course["_id"])
    attached_students = await db.students.count_documents({"course_id": cid})
    if attached_students > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete course: {attached_students} students enrolled.")

    await db.units.delete_many({"course_id": cid})
    await db.courses.delete_one({"_id": course["_id"]})


# ==========================================
# Units / Subjects API
# ==========================================
@router.get("/units", response_model=List[UnitResponse])
async def list_units(
    course_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Lists curriculum units optionally filtered by parent course."""
    query = {"course_id": course_id} if course_id else {}
    cursor = db.units.find(query).sort("unit_code", 1)
    units = await cursor.to_list(1000)

    courses = {str(c["_id"]): c for c in await db.courses.find().to_list(500)}

    results = []
    for u in units:
        cid = u.get("course_id", "")
        course = courses.get(cid, {})
        results.append(
            UnitResponse(
                id=str(u["_id"]),
                unit_code=u["unit_code"],
                name=u["name"],
                course_id=cid,
                course_code=course.get("course_code"),
                course_title=course.get("title"),
                credit_hours=u.get("credit_hours", 3),
                description=u.get("description"),
                is_active=u.get("is_active", True),
                created_at=u.get("created_at", datetime.now(timezone.utc))
            )
        )
    return results


@router.post("/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def create_unit(
    data: UnitCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Creates a new unit assigned to a course."""
    course = await db.courses.find_one({"_id": ObjectId(data.course_id)}) if ObjectId.is_valid(data.course_id) else await db.courses.find_one({"course_code": data.course_id})
    if not course:
        raise HTTPException(status_code=400, detail="Parent course not found.")

    existing = await db.units.find_one({"unit_code": data.unit_code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail=f"Unit code '{data.unit_code}' already exists.")

    now = datetime.now(timezone.utc)
    unit_doc = {
        "unit_code": data.unit_code.upper().strip(),
        "name": data.name.strip(),
        "course_id": str(course["_id"]),
        "credit_hours": data.credit_hours,
        "description": data.description,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    res = await db.units.insert_one(unit_doc)
    unit_doc["_id"] = str(res.inserted_id)

    return UnitResponse(
        id=unit_doc["_id"],
        unit_code=unit_doc["unit_code"],
        name=unit_doc["name"],
        course_id=unit_doc["course_id"],
        course_code=course.get("course_code"),
        course_title=course.get("title"),
        credit_hours=unit_doc["credit_hours"],
        description=unit_doc["description"],
        is_active=True,
        created_at=now
    )


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Deletes a unit."""
    filter_q = {"_id": ObjectId(unit_id)} if ObjectId.is_valid(unit_id) else {"unit_code": unit_id}
    res = await db.units.delete_one(filter_q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Unit not found.")


# ==========================================
# Venues / Classrooms API
# ==========================================
@router.get("/venues", response_model=List[VenueResponse])
async def list_venues(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Lists classrooms, lecture halls, and laboratories."""
    cursor = db.venues.find().sort("venue_code", 1)
    venues = await cursor.to_list(500)
    return [
        VenueResponse(
            id=str(v["_id"]),
            venue_code=v["venue_code"],
            name=v["name"],
            building=v.get("building", "Main Block"),
            room_number=v.get("room_number", ""),
            capacity=v.get("capacity", 50),
            venue_type=v.get("venue_type", "LECTURE_HALL"),
            is_active=v.get("is_active", True),
            created_at=v.get("created_at", datetime.now(timezone.utc))
        )
        for v in venues
    ]


@router.post("/venues", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
async def create_venue(
    data: VenueCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Registers a new teaching venue."""
    existing = await db.venues.find_one({"venue_code": data.venue_code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail=f"Venue code '{data.venue_code}' already exists.")

    now = datetime.now(timezone.utc)
    venue_doc = {
        "venue_code": data.venue_code.upper().strip(),
        "name": data.name.strip(),
        "building": data.building.strip(),
        "room_number": data.room_number.strip(),
        "capacity": data.capacity,
        "venue_type": data.venue_type,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    res = await db.venues.insert_one(venue_doc)
    venue_doc["_id"] = str(res.inserted_id)

    return VenueResponse(
        id=venue_doc["_id"],
        venue_code=venue_doc["venue_code"],
        name=venue_doc["name"],
        building=venue_doc["building"],
        room_number=venue_doc["room_number"],
        capacity=venue_doc["capacity"],
        venue_type=venue_doc["venue_type"],
        is_active=True,
        created_at=now
    )


@router.delete("/venues/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_venue(
    venue_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Deletes a venue."""
    filter_q = {"_id": ObjectId(venue_id)} if ObjectId.is_valid(venue_id) else {"venue_code": venue_id}
    res = await db.venues.delete_one(filter_q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Venue not found.")
