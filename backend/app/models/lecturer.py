"""
Lecturer Domain Model
"""

from typing import List, Optional
from pydantic import EmailStr, Field
from .base import MongoBaseModel


class LecturerModel(MongoBaseModel):
    user_id: str = Field(..., description="References UserModel id")
    staff_id: str = Field(..., description="University Faculty Staff ID")
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str
    assigned_courses: List[str] = Field(default_factory=list, description="List of Course IDs")
    assigned_units: List[str] = Field(default_factory=list, description="List of Unit IDs")
