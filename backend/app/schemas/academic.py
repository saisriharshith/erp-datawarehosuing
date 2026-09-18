"""
Academic Hierarchy Schemas: Course, Unit, Venue, Enrollment
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# Course Schemas
class CourseCreate(BaseModel):
    course_code: str = Field(..., description="Unique course code e.g. BCT, CS-2026")
    title: str = Field(..., description="Full course name e.g. Computer Science and Engineering")
    department: str = Field(default="Computing and Information Technology")
    credits: int = Field(default=4, ge=1)
    duration_years: int = Field(default=4, ge=1, le=6)


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    credits: Optional[int] = Field(default=None, ge=1)
    duration_years: Optional[int] = Field(default=None, ge=1, le=6)
    is_active: Optional[bool] = None


class CourseResponse(BaseModel):
    id: str
    course_code: str
    title: str
    department: str
    credits: int
    duration_years: int
    is_active: bool
    units_count: int = 0
    enrolled_students_count: int = 0
    created_at: datetime


# Unit Schemas
class UnitCreate(BaseModel):
    unit_code: str = Field(..., description="Unique unit code e.g. BCT 2411")
    name: str = Field(..., description="Unit title e.g. Project Implementation")
    course_id: str
    credit_hours: int = Field(default=3, ge=1)
    description: Optional[str] = None


class UnitUpdate(BaseModel):
    name: Optional[str] = None
    course_id: Optional[str] = None
    credit_hours: Optional[int] = Field(default=None, ge=1)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class UnitResponse(BaseModel):
    id: str
    unit_code: str
    name: str
    course_id: str
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    credit_hours: int
    description: Optional[str] = None
    is_active: bool
    created_at: datetime


# Venue Schemas
class VenueCreate(BaseModel):
    venue_code: str = Field(..., description="Unique venue code e.g. LH-101, LAB-B34")
    name: str = Field(..., description="Venue name e.g. Turing Computer Lab")
    building: str = Field(default="Engineering Block")
    room_number: str = Field(default="B34")
    capacity: int = Field(default=45, ge=1)
    venue_type: str = Field(default="LECTURE_HALL")


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    building: Optional[str] = None
    room_number: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    venue_type: Optional[str] = None
    is_active: Optional[bool] = None


class VenueResponse(BaseModel):
    id: str
    venue_code: str
    name: str
    building: str
    room_number: str
    capacity: int
    venue_type: str
    is_active: bool
    created_at: datetime
