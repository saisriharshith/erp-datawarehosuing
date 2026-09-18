"""
Face Embedding and Biometric Storage Model
"""

from typing import List, Optional
from pydantic import Field
from .base import MongoBaseModel


class FaceEmbeddingModel(MongoBaseModel):
    student_id: str = Field(..., description="References StudentModel student_id")
    embedding: List[float] = Field(..., description="512-dimensional ArcFace normalized vector")
    imagekit_file_id: Optional[str] = Field(default=None, description="ImageKit cloud file ID")
    imagekit_url: Optional[str] = Field(default=None, description="ImageKit secure CDN image URL")
    model: str = Field(default="buffalo_l", description="InsightFace model package used")
    model_version: str = Field(default="arcface_r50_v1")
    quality_score: float = Field(default=1.0, description="Face quality assessment score")
    sample_index: int = Field(default=1, description="Sample index (1..10)")
