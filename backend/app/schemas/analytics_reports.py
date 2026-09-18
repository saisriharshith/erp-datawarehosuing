"""
Analytics, Reporting, and Admin Schemas
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# Analytics Schemas
class DailyTrendPoint(BaseModel):
    date: str
    present: int = 0
    present_count: int = 0
    total_sessions: int = 0
    attendance_rate: float = 0.0


class CourseAttendanceStat(BaseModel):
    course_code: str
    course_title: str
    course_name: str = ""
    total_enrolled: int = 0
    attendance_rate: float = 0.0


class AtRiskStudent(BaseModel):
    student_id: str
    student_name: str
    student_reg_no: str
    course_name: str
    course_code: str = ""
    attended_sessions: int = 0
    total_sessions: int = 0
    attendance_rate: float = 0.0


class AdminDashboardMetrics(BaseModel):
    total_students: int
    enrolled_students: int = 0
    total_lecturers: int
    total_courses: int
    total_units: int
    total_sessions: int = 0
    active_sessions_now: int
    today_sessions_count: int
    today_attendance_percentage: float
    overall_attendance_rate: float = 0.0
    today_present_count: int
    today_absent_count: int
    attendance_trends: List[DailyTrendPoint] = []
    attendance_by_day: List[DailyTrendPoint] = []
    course_stats: List[CourseAttendanceStat] = []
    course_attendance: List[CourseAttendanceStat] = []
    at_risk_students: List[AtRiskStudent] = []


class LecturerDashboardMetrics(BaseModel):
    assigned_courses_count: int
    assigned_units_count: int
    total_sessions_conducted: int
    total_sessions: int = 0
    active_session_id: Optional[str] = None
    average_attendance_percentage: float
    average_turnout_rate: float = 0.0
    total_present_marked: int = 0
    recent_sessions: List[Dict[str, Any]] = []
    unit_attendance_stats: List[Dict[str, Any]] = []


# Reporting Schemas
class ReportFilter(BaseModel):
    course_id: Optional[str] = None
    unit_id: Optional[str] = None
    venue_id: Optional[str] = None
    lecturer_id: Optional[str] = None
    student_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ReportRow(BaseModel):
    date: str
    student_id: str
    student_name: str
    course_code: str
    unit_code: str
    unit_name: str
    venue_code: str
    lecturer_name: str
    session_code: str
    status: str
    marked_at: str
    similarity_score: float


class ReportSummaryResponse(BaseModel):
    total_records: int
    present_count: int
    absent_count: int
    attendance_percentage: float
    records: List[ReportRow]


# Admin System Settings & Audit Logs
class SystemSettingsUpdate(BaseModel):
    face_similarity_threshold: Optional[float] = Field(default=None, ge=0.3, le=0.99)
    min_enrollment_samples: Optional[int] = Field(default=None, ge=1, le=10)
    max_enrollment_samples: Optional[int] = Field(default=None, ge=5, le=20)
    liveness_enabled: Optional[bool] = None
    liveness_threshold: Optional[float] = Field(default=None, ge=0.1, le=0.99)


class SystemSettingsResponse(BaseModel):
    face_similarity_threshold: float
    min_enrollment_samples: int
    max_enrollment_samples: int
    liveness_enabled: bool
    liveness_threshold: float
    model_name: str
    environment: str


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime
