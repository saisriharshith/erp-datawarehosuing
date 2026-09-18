"""
User Account Model
"""

from typing import Optional
from pydantic import EmailStr, Field
from .base import MongoBaseModel


class UserRole:
    ADMIN = "ADMIN"
    LECTURER = "LECTURER"
    ALL_ROLES = [ADMIN, LECTURER]


class UserModel(MongoBaseModel):
    email: EmailStr
    hashed_password: str
    full_name: str
    role: str = Field(default=UserRole.LECTURER)
    is_active: bool = True
    avatar_url: Optional[str] = None
