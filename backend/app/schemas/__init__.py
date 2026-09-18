"""
Schemas Package Exports
"""

from .auth import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    UserCreate,
    ChangePasswordRequest
)
from .student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentDetailResponse,
    StudentListResponse
)
from .lecturer import (
    LecturerCreate,
    LecturerUpdate,
    LecturerResponse
)
from .academic import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    UnitCreate,
    UnitUpdate,
    UnitResponse,
    VenueCreate,
    VenueUpdate,
    VenueResponse
)
from .attendance import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    AttendanceRecordResponse,
    DetectedFaceResult,
    RecognizeFrameRequest,
    RecognizeFrameResponse
)
from .enrollment import (
    EnrollSampleRequest,
    FaceQualityMetrics,
    EnrollSampleResponse,
    StudentEnrollmentInfoResponse
)
from .analytics_reports import (
    AdminDashboardMetrics,
    LecturerDashboardMetrics,
    DailyTrendPoint,
    CourseAttendanceStat,
    ReportFilter,
    ReportRow,
    ReportSummaryResponse,
    SystemSettingsUpdate,
    SystemSettingsResponse,
    AuditLogResponse
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "UserCreate",
    "ChangePasswordRequest",
    "StudentCreate",
    "StudentUpdate",
    "StudentResponse",
    "StudentDetailResponse",
    "StudentListResponse",
    "LecturerCreate",
    "LecturerUpdate",
    "LecturerResponse",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "UnitCreate",
    "UnitUpdate",
    "UnitResponse",
    "VenueCreate",
    "VenueUpdate",
    "VenueResponse",
    "SessionCreate",
    "SessionUpdate",
    "SessionResponse",
    "AttendanceRecordResponse",
    "DetectedFaceResult",
    "RecognizeFrameRequest",
    "RecognizeFrameResponse",
    "EnrollSampleRequest",
    "FaceQualityMetrics",
    "EnrollSampleResponse",
    "StudentEnrollmentInfoResponse",
    "AdminDashboardMetrics",
    "LecturerDashboardMetrics",
    "DailyTrendPoint",
    "CourseAttendanceStat",
    "ReportFilter",
    "ReportRow",
    "ReportSummaryResponse",
    "SystemSettingsUpdate",
    "SystemSettingsResponse",
    "AuditLogResponse",
]
