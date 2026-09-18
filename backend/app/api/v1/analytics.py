"""
Analytics API Endpoints
"""

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...models.user import UserModel
from ...schemas.analytics_reports import AdminDashboardMetrics, LecturerDashboardMetrics
from ...services.analytics_service import analytics_service
from ..deps import get_current_user, get_db, require_admin, require_lecturer_or_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/admin", response_model=AdminDashboardMetrics)
async def get_admin_analytics(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Retrieves live aggregate institutional attendance analytics for administrators."""
    return await analytics_service.get_admin_dashboard(db)


@router.get("/lecturer", response_model=LecturerDashboardMetrics)
async def get_lecturer_analytics(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserModel = Depends(require_lecturer_or_admin)
):
    """Retrieves analytics tailored to the logged-in lecturer."""
    return await analytics_service.get_lecturer_dashboard(db, current_user.id)
