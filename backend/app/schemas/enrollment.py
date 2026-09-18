"""
Face Enrollment Request and Response Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class EnrollSampleRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded JPEG/PNG image data from camera")
    sample_index: int = Field(default=1, ge=1, le=10)


class FaceQualityMetrics(BaseModel):
    is_valid: bool
    faces_detected: int
    sharpness_score: float
    brightness_score: float
    face_area_ratio: float
    feedback_message: str


class EnrollSampleResponse(BaseModel):
    success: bool
    sample_index: int
    total_enrolled: int
    target_samples: int
    quality_score: float
    feedback_message: str
    face_enrollment_status: str
    imagekit_url: Optional[str] = None


class StudentEnrollmentInfoResponse(BaseModel):
    student_id: str
    full_name: str
    face_enrollment_status: str
    enrolled_samples_count: int
    min_required: int
    target_required: int
    photo_urls: List[str] = Field(default_factory=list)
