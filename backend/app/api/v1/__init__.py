"""
API v1 Router Aggregator
"""

from fastapi import APIRouter
from .auth import router as auth_router
from .students import router as students_router
from .lecturers import router as lecturers_router
from .academic import router as academic_router
from .enrollment import router as enrollment_router
from .attendance import router as attendance_router
from .analytics import router as analytics_router
from .reports import router as reports_router
from .admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(students_router)
api_v1_router.include_router(lecturers_router)
api_v1_router.include_router(academic_router)
api_v1_router.include_router(enrollment_router)
api_v1_router.include_router(attendance_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(admin_router)
