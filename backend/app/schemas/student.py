"""
Student Request and Response Schemas
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


class StudentCreate(BaseModel):
    student_id: Optional[str] = Field(default=None, description="Unique Registration Number e.g. BCT/2026/042")
    registration_number: Optional[str] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    course_id: str
    year: int = Field(default=1, ge=1, le=5)
    academic_year: Optional[int] = None
    section: str = Field(default="A")
    semester: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_aliases(cls, data: any):
        if isinstance(data, dict):
            sid = data.get("student_id") or data.get("registration_number")
            fname = data.get("full_name")
            if not fname:
                parts = [data.get("first_name", ""), data.get("last_name", "")]
                fname = " ".join(p for p in parts if p).strip() or "Student"
            data["student_id"] = sid or "ST-TEMP"
            data["full_name"] = fname
            if not data.get("phone") and data.get("phone_number"):
                data["phone"] = data.get("phone_number")
            if not data.get("year") and data.get("academic_year"):
                data["year"] = data.get("academic_year")
        return data


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    course_id: Optional[str] = None
    year: Optional[int] = Field(default=None, ge=1, le=5)
    section: Optional[str] = None
    status: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    student_id: str
    registration_number: Optional[str] = None
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    course_id: str
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    year: int = 1
    academic_year: Optional[int] = 1
    section: str = "A"
    semester: Optional[int] = 1
    status: str = "ACTIVE"
    face_enrollment_status: str = "PENDING"
    enrollment_status: Optional[str] = "PENDING"
    enrolled_samples_count: int = 0
    embedding_count: Optional[int] = 0
    primary_photo_url: Optional[str] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: any):
        if isinstance(data, dict):
            # student_id <-> registration_number
            sid = data.get("student_id") or data.get("registration_number") or ""
            data["student_id"] = sid
            data["registration_number"] = sid

            # full_name <-> first_name / last_name
            fname = data.get("full_name")
            if not fname:
                parts = [data.get("first_name", ""), data.get("last_name", "")]
                fname = " ".join(p for p in parts if p).strip() or "Student"
            data["full_name"] = fname
            parts = fname.split(" ", 1)
            data["first_name"] = parts[0]
            data["last_name"] = parts[1] if len(parts) > 1 else ""

            # face_enrollment_status <-> enrollment_status
            status_val = data.get("face_enrollment_status") or data.get("enrollment_status") or "PENDING"
            data["face_enrollment_status"] = status_val
            data["enrollment_status"] = status_val

            # enrolled_samples_count <-> embedding_count
            cnt = data.get("enrolled_samples_count") if data.get("enrolled_samples_count") is not None else data.get("embedding_count", 0)
            data["enrolled_samples_count"] = cnt
            data["embedding_count"] = cnt

            # year <-> academic_year
            yr = data.get("year") or data.get("academic_year") or 1
            data["year"] = yr
            data["academic_year"] = yr

            if "semester" not in data or data["semester"] is None:
                data["semester"] = 1

        return data


class StudentDetailResponse(StudentResponse):
    attendance_percentage: float = 0.0
    total_classes: int = 0
    attended_classes: int = 0
    enrolled_photos: List[str] = Field(default_factory=list, description="ImageKit photo URLs")


class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[StudentResponse]
