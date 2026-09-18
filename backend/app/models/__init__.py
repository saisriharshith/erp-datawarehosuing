"""
Models Package Exports
"""

from .base import MongoBaseModel, PyObjectId
from .user import UserModel, UserRole
from .student import StudentModel, StudentStatus, EnrollmentStatus
from .lecturer import LecturerModel
from .academic import CourseModel, UnitModel, VenueModel, VenueType, EnrollmentModel
from .face_embedding import FaceEmbeddingModel
from .attendance import (
    AttendanceSessionModel,
    AttendanceRecordModel,
    SessionStatus,
    AttendanceStatus
)
from .audit_settings import AuditLogModel, SystemSettingsModel

__all__ = [
    "MongoBaseModel",
    "PyObjectId",
    "UserModel",
    "UserRole",
    "StudentModel",
    "StudentStatus",
    "EnrollmentStatus",
    "LecturerModel",
    "CourseModel",
    "UnitModel",
    "VenueModel",
    "VenueType",
    "EnrollmentModel",
    "FaceEmbeddingModel",
    "AttendanceSessionModel",
    "AttendanceRecordModel",
    "SessionStatus",
    "AttendanceStatus",
    "AuditLogModel",
    "SystemSettingsModel",
]
