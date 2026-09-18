"""
Face Enrollment API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...models.user import UserModel
from ...schemas.enrollment import (
    EnrollSampleRequest,
    EnrollSampleResponse,
    StudentEnrollmentInfoResponse
)
from ...services.face_enrollment_service import face_enrollment_service
from ...services.liveness_service import liveness_service
from ..deps import get_db, require_admin

router = APIRouter(prefix="/enrollment", tags=["Face Enrollment"])


@router.post("/{student_id}/samples", response_model=EnrollSampleResponse)
async def enroll_face_sample(
    student_id: str,
    data: EnrollSampleRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """
    Captures, validates, extracts ArcFace embedding, and uploads sample to ImageKit.
    Enforces quality checks (one face, pose, blur, illumination).
    """
    try:
        response = await face_enrollment_service.enroll_sample(
            db=db,
            student_id=student_id,
            image_base64=data.image_base64,
            sample_index=data.sample_index,
            acting_user_id=admin.id
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


@router.get("/{student_id}/info", response_model=StudentEnrollmentInfoResponse)
async def get_enrollment_info(
    student_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Retrieves current face enrollment sample count and ImageKit photo URLs."""
    try:
        return await face_enrollment_service.get_student_enrollment_info(db, student_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def reset_face_enrollment(
    student_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: UserModel = Depends(require_admin)
):
    """Purges all face biometric samples and reset status to PENDING."""
    await face_enrollment_service.delete_student_enrollment(db, student_id, admin.id)


@router.get("/challenge/{token}")
async def get_liveness_challenge(token: str):
    """Issues an interactive liveness challenge for camera guidance."""
    return liveness_service.generate_challenge(token)
