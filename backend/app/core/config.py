"""
Application Configuration Module
Using Pydantic Settings for type-safe environment variable management.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "AI Face Recognition Attendance System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Authentication & Security
    SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-must-be-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "attendance_db"
    USE_MOCK_DB_IF_UNAVAILABLE: bool = True

    # ImageKit Cloud Storage
    IMAGEKIT_PUBLIC_KEY: str = "your_imagekit_public_key"
    IMAGEKIT_PRIVATE_KEY: str = "your_imagekit_private_key"
    IMAGEKIT_URL_ENDPOINT: str = "https://ik.imagekit.io/your_imagekit_id"
    IMAGEKIT_FOLDER: str = "college_attendance"

    # Computer Vision & Face Recognition
    FACE_SIMILARITY_THRESHOLD: float = 0.60
    MIN_ENROLLMENT_SAMPLES: int = 5
    MAX_ENROLLMENT_SAMPLES: int = 10
    LIVENESS_ENABLED: bool = True
    LIVENESS_THRESHOLD: float = 0.80
    DETECTION_THRESHOLD: float = 0.50
    MODEL_NAME: str = "buffalo_l"  # Options: buffalo_l, buffalo_s, buffalo_sc

    # CORS Configuration
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
