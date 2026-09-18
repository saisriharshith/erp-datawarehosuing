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
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    course_id: str
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    year: int
    section: str
    status: str
    face_enrollment_status: str
    enrolled_samples_count: int
    primary_photo_url: Optional[str] = None
    created_at: datetime


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
