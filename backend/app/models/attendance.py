"""
Attendance Sessions and Records Models
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import Field
from .base import MongoBaseModel


class SessionStatus:
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ALL_STATUSES = [CREATED, ACTIVE, COMPLETED, CANCELLED]


class AttendanceStatus:
    PRESENT = "PRESENT"
    LATE = "LATE"
    ABSENT = "ABSENT"


class AttendanceSessionModel(MongoBaseModel):
    session_code: str = Field(..., description="Unique generated code for the session")
    course_id: str = Field(..., description="References CourseModel id")
    unit_id: str = Field(..., description="References UnitModel id")
    venue_id: str = Field(..., description="References VenueModel id")
    lecturer_id: str = Field(..., description="References Lecturer UserModel id")
    status: str = Field(default=SessionStatus.CREATED)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_present: int = Field(default=0)
    notes: Optional[str] = None


class AttendanceRecordModel(MongoBaseModel):
    session_id: str = Field(..., description="References AttendanceSessionModel id")
    student_id: str = Field(..., description="References StudentModel student_id")
    course_id: str = Field(..., description="Denormalized Course ID for fast reporting")
    unit_id: str = Field(..., description="Denormalized Unit ID for fast reporting")
    venue_id: str = Field(..., description="Denormalized Venue ID for fast reporting")
    lecturer_id: str = Field(..., description="Denormalized Lecturer ID for fast reporting")
    status: str = Field(default=AttendanceStatus.PRESENT)
    marked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    similarity_score: float = Field(default=1.0, description="Cosine similarity score during recognition")
    liveness_score: Optional[float] = Field(default=None, description="Liveness score if verified")
    verified_method: str = Field(default="INSIGHTFACE_ARCFACE", description="Recognition engine method")
