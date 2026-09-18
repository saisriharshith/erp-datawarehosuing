"""
Admin Operations, System Settings, and Audit Logs Endpoints
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...core.config import settings
from ...models.user import UserModel
from ...schemas.analytics_reports import AuditLogResponse, SystemSettingsResponse, SystemSettingsUpdate
from ..deps import get_db, require_admin

router = APIRouter(prefix="/admin", tags=["Admin System"])


@router.get("/settings", response_model=SystemSettingsResponse)
async def get_system_settings(
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Retrieves current face recognition parameters and system configurations."""
    # Check if overrides are in database
    db_thresh = await db.system_settings.find_one({"key": "face_similarity_threshold"})
    threshold = float(db_thresh["value"]) if db_thresh else settings.FACE_SIMILARITY_THRESHOLD

    db_live = await db.system_settings.find_one({"key": "liveness_enabled"})
    liveness_enabled = bool(db_live["value"]) if db_live else settings.LIVENESS_ENABLED

    return SystemSettingsResponse(
        face_similarity_threshold=threshold,
        min_enrollment_samples=settings.MIN_ENROLLMENT_SAMPLES,
        max_enrollment_samples=settings.MAX_ENROLLMENT_SAMPLES,
        liveness_enabled=liveness_enabled,
        liveness_threshold=settings.LIVENESS_THRESHOLD,
        model_name=settings.MODEL_NAME,
        environment=settings.ENVIRONMENT
    )


@router.put("/settings", response_model=SystemSettingsResponse)
async def update_system_settings(
    data: SystemSettingsUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Updates face recognition thresholds and system tolerances dynamically."""
    now = datetime.now(timezone.utc)
    if data.face_similarity_threshold is not None:
        settings.FACE_SIMILARITY_THRESHOLD = data.face_similarity_threshold
        await db.system_settings.update_one(
            {"key": "face_similarity_threshold"},
            {"$set": {"value": data.face_similarity_threshold, "updated_at": now, "updated_by": admin.id}},
            upsert=True
        )

    if data.min_enrollment_samples is not None:
        settings.MIN_ENROLLMENT_SAMPLES = data.min_enrollment_samples
        await db.system_settings.update_one(
            {"key": "min_enrollment_samples"},
            {"$set": {"value": data.min_enrollment_samples, "updated_at": now, "updated_by": admin.id}},
            upsert=True
        )

    if data.max_enrollment_samples is not None:
        settings.MAX_ENROLLMENT_SAMPLES = data.max_enrollment_samples
        await db.system_settings.update_one(
            {"key": "max_enrollment_samples"},
            {"$set": {"value": data.max_enrollment_samples, "updated_at": now, "updated_by": admin.id}},
            upsert=True
        )

    if data.liveness_enabled is not None:
        settings.LIVENESS_ENABLED = data.liveness_enabled
        await db.system_settings.update_one(
            {"key": "liveness_enabled"},
            {"$set": {"value": data.liveness_enabled, "updated_at": now, "updated_by": admin.id}},
            upsert=True
        )

    await db.audit_logs.insert_one({
        "user_id": admin.id,
        "action": "UPDATE_SYSTEM_SETTINGS",
        "resource_type": "settings",
        "details": data.model_dump(exclude_none=True),
        "created_at": now,
        "updated_at": now
    })

    return SystemSettingsResponse(
        face_similarity_threshold=settings.FACE_SIMILARITY_THRESHOLD,
        min_enrollment_samples=settings.MIN_ENROLLMENT_SAMPLES,
        max_enrollment_samples=settings.MAX_ENROLLMENT_SAMPLES,
        liveness_enabled=settings.LIVENESS_ENABLED,
        liveness_threshold=settings.LIVENESS_THRESHOLD,
        model_name=settings.MODEL_NAME,
        environment=settings.ENVIRONMENT
    )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Lists audit trail records for compliance and accountability."""
    cursor = db.audit_logs.find().sort("created_at", -1).limit(limit)
    logs = await cursor.to_list(limit)
    return [
        AuditLogResponse(
            id=str(log["_id"]),
            user_id=log.get("user_id"),
            user_email=log.get("user_email"),
            user_role=log.get("user_role"),
            action=log.get("action", "UNKNOWN"),
            resource_type=log.get("resource_type", "system"),
            resource_id=log.get("resource_id"),
            details=log.get("details", {}),
            ip_address=log.get("ip_address"),
            created_at=log.get("created_at", datetime.now(timezone.utc))
        )
        for log in logs
    ]
