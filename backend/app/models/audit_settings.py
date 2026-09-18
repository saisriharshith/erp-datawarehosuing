"""
Audit Logs and System Settings Models
"""

from typing import Any, Dict, Optional
from pydantic import Field
from .base import MongoBaseModel


class AuditLogModel(MongoBaseModel):
    user_id: Optional[str] = Field(default=None, description="Acting User ID")
    user_email: Optional[str] = Field(default=None)
    user_role: Optional[str] = Field(default=None)
    action: str = Field(..., description="Action performed e.g. LOGIN, ENROLL_FACE, START_SESSION, MARK_ATTENDANCE")
    resource_type: str = Field(..., description="Resource entity e.g. student, session, user, settings")
    resource_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None


class SystemSettingsModel(MongoBaseModel):
    key: str = Field(..., description="Unique setting identifier")
    value: Any = Field(..., description="Value of the setting")
    description: Optional[str] = None
    category: str = Field(default="GENERAL")
