"""
Attendance Sessions, Recognition, and Records Schemas
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    course_id: str
    unit_id: str
    venue_id: str
    notes: Optional[str] = None


class SessionUpdate(BaseModel):
    notes: Optional[str] = None
    venue_id: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    session_code: str
    course_id: str
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    unit_id: str
    unit_code: Optional[str] = None
    unit_name: Optional[str] = None
    venue_id: str
    venue_code: Optional[str] = None
    venue_name: Optional[str] = None
    lecturer_id: str
    lecturer_name: Optional[str] = None
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_present: int
    notes: Optional[str] = None
    created_at: datetime


class AttendanceRecordResponse(BaseModel):
    id: str
    session_id: str
    student_id: str
    student_name: Optional[str] = None
    student_registration_number: Optional[str] = None
    course_id: str
    unit_id: str
    venue_id: str
    lecturer_id: str
    status: str
    marked_at: datetime
    similarity_score: float
    liveness_score: Optional[float] = None
    verified_method: str


class DetectedFaceResult(BaseModel):
    box: List[int] = Field(..., description="[x1, y1, x2, y2] bounding box coordinates")
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    registration_number: Optional[str] = None
    similarity_score: float = 0.0
    status: str = Field(..., description="NEW_PRESENT, ALREADY_MARKED, or UNKNOWN")
    is_live: Optional[bool] = None
    liveness_score: Optional[float] = None


class RecognizeFrameRequest(BaseModel):
    image_base64: str = Field(..., description="JPEG or PNG frame encoded in base64")


class RecognizeFrameResponse(BaseModel):
    session_id: str
    faces: List[DetectedFaceResult]
    total_present: int
    newly_marked_count: int
    processing_time_ms: float
