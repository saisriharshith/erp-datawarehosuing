"""
Lecturer Request and Response Schemas
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class LecturerCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    staff_id: str = Field(..., description="Staff registration code e.g. LEC-0015")
    phone: Optional[str] = None
    department: str = Field(default="Computing and Information Technology")
    assigned_courses: List[str] = Field(default_factory=list)
    assigned_units: List[str] = Field(default_factory=list)


class LecturerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    assigned_courses: Optional[List[str]] = None
    assigned_units: Optional[List[str]] = None


class LecturerResponse(BaseModel):
    id: str
    user_id: str
    staff_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str
    assigned_courses: List[str] = Field(default_factory=list)
    assigned_units: List[str] = Field(default_factory=list)
    assigned_course_names: List[str] = Field(default_factory=list)
    assigned_unit_names: List[str] = Field(default_factory=list)
    created_at: datetime
