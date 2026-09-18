"""
Student Domain Model
"""

from typing import Optional
from pydantic import EmailStr, Field
from .base import MongoBaseModel


class EnrollmentStatus:
    PENDING = "PENDING"
    ENROLLED = "ENROLLED"


class StudentStatus:
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class StudentModel(MongoBaseModel):
    student_id: str = Field(..., description="Unique college registration number or matriculation ID")
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    course_id: str
    year: int = Field(default=1, ge=1, le=5)
    section: str = Field(default="A")
    status: str = Field(default=StudentStatus.ACTIVE)
    face_enrollment_status: str = Field(default=EnrollmentStatus.PENDING)
    enrolled_samples_count: int = 0
    primary_photo_url: Optional[str] = None
