"""
Academic Structure Models: Course, Unit, Venue, Enrollment
"""

from typing import Optional
from pydantic import Field
from .base import MongoBaseModel


class CourseModel(MongoBaseModel):
    course_code: str = Field(..., description="e.g. CS101, BCT")
    title: str = Field(..., description="e.g. Computer Science and Engineering")
    department: str = Field(default="Computing and Information Technology")
    credits: int = Field(default=4)
    duration_years: int = Field(default=4)
    is_active: bool = True


class UnitModel(MongoBaseModel):
    unit_code: str = Field(..., description="e.g. CS2411, AI-301")
    name: str = Field(..., description="e.g. Machine Learning & Computer Vision")
    course_id: str = Field(..., description="References CourseModel id")
    credit_hours: int = Field(default=3)
    description: Optional[str] = None
    is_active: bool = True


class VenueType:
    LECTURE_HALL = "LECTURE_HALL"
    LABORATORY = "LABORATORY"
    SEMINAR_ROOM = "SEMINAR_ROOM"
    AUDITORIUM = "AUDITORIUM"


class VenueModel(MongoBaseModel):
    venue_code: str = Field(..., description="e.g. LH-101, LAB-B34")
    name: str = Field(..., description="e.g. Turing Computer Vision Lab")
    building: str = Field(default="Engineering Block A")
    room_number: str = Field(default="101")
    capacity: int = Field(default=60)
    venue_type: str = Field(default=VenueType.LECTURE_HALL)
    is_active: bool = True


class EnrollmentModel(MongoBaseModel):
    student_id: str = Field(..., description="References StudentModel id or registration number")
    course_id: str = Field(..., description="References CourseModel id")
    academic_year: str = Field(default="2026-2027")
    semester: int = Field(default=1)
    status: str = Field(default="ACTIVE")
