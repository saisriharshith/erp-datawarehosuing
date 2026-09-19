"""
Face Enrollment Service
Orchestrates image quality validation, InsightFace embedding generation,
ImageKit cloud upload, MongoDB persistence, and in-memory index synchronization.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.config import settings
from ..core.logging import logger
from ..models.student import EnrollmentStatus
from ..models.face_embedding import FaceEmbeddingModel
from ..models.audit_settings import AuditLogModel
from ..schemas.enrollment import EnrollSampleResponse, StudentEnrollmentInfoResponse
from ..utils.image_processing import (
    assess_face_quality,
    decode_base64_to_image
)
from .face_engine import face_engine
from .face_recognition import recognition_index
from .imagekit_service import imagekit_service


class FaceEnrollmentService:
    async def _get_sample_thresholds(self, db: AsyncIOMotorDatabase) -> tuple[int, int]:
        try:
            db_min = await db.system_settings.find_one({"key": "min_enrollment_samples"})
            min_s = int(db_min["value"]) if db_min else settings.MIN_ENROLLMENT_SAMPLES
            db_max = await db.system_settings.find_one({"key": "max_enrollment_samples"})
            max_s = int(db_max["value"]) if db_max else settings.MAX_ENROLLMENT_SAMPLES
            return min_s, max_s
        except Exception:
            return settings.MIN_ENROLLMENT_SAMPLES, settings.MAX_ENROLLMENT_SAMPLES

    async def _find_student(self, db: AsyncIOMotorDatabase, student_id: str):
        filter_q = {"$or": [{"student_id": student_id}]}
        if ObjectId.is_valid(student_id):
            filter_q["$or"].append({"_id": ObjectId(student_id)})
        return await db.students.find_one(filter_q)

    async def enroll_sample(
        self,
        db: AsyncIOMotorDatabase,
        student_id: str,
        image_base64: str,
        sample_index: int = 1,
        acting_user_id: Optional[str] = None
    ) -> EnrollSampleResponse:
        """
        Validates frame, extracts ArcFace embedding, uploads image to ImageKit,
        saves to MongoDB face_embeddings, and updates student enrollment status.
        Supports lookup by MongoDB ObjectId or registration number (student_id).
        """
        min_required, target_required = await self._get_sample_thresholds(db)

        student = await self._find_student(db, student_id)
        if not student:
            raise ValueError(f"Student with ID '{student_id}' does not exist.")

        canonical_student_id = student["student_id"]
        student_mongo_id = student["_id"]

        # Decode frame
        img_bgr = decode_base64_to_image(image_base64)
        if img_bgr is None:
            return EnrollSampleResponse(
                success=False,
                sample_index=sample_index,
                total_enrolled=student.get("enrolled_samples_count", 0),
                target_samples=target_required,
                quality_score=0.0,
                feedback_message="Invalid image format. Could not decode base64 stream.",
                face_enrollment_status=student.get("face_enrollment_status", EnrollmentStatus.PENDING)
            )


        # Detect face & extract embedding
        detected_faces = face_engine.detect_and_extract(img_bgr)
        faces_count = len(detected_faces)

        face_box = detected_faces[0]["box"] if faces_count > 0 else None
        quality = assess_face_quality(img_bgr, face_box, faces_count)

        if not quality.is_valid or faces_count != 1:
            return EnrollSampleResponse(
                success=False,
                sample_index=sample_index,
                total_enrolled=student.get("enrolled_samples_count", 0),
                target_samples=settings.MAX_ENROLLMENT_SAMPLES,
                quality_score=quality.sharpness_score,
                feedback_message=quality.feedback_message,
                face_enrollment_status=student.get("face_enrollment_status", EnrollmentStatus.PENDING)
            )

        face_data = detected_faces[0]
        embedding = face_data["embedding"]

        # Upload image to ImageKit
        safe_student_id = canonical_student_id.replace("/", "_").replace(" ", "_")
        file_name = f"{safe_student_id}_sample_{sample_index}.jpg"
        upload_res = await imagekit_service.upload_image(
            image_bytes_or_base64=image_base64,
            file_name=file_name,
            folder=f"students/{safe_student_id}"
        )

        now = datetime.now(timezone.utc)
        embedding_doc = {
            "student_id": canonical_student_id,
            "embedding": embedding,
            "imagekit_file_id": upload_res["file_id"],
            "imagekit_url": upload_res["url"],
            "model": face_engine.model_name,
            "model_version": "arcface_v2_sc",
            "quality_score": quality.sharpness_score,
            "sample_index": sample_index,
            "created_at": now,
            "updated_at": now
        }

        # Check if sample_index already exists for student, update or insert
        await db.face_embeddings.update_one(
            {"student_id": canonical_student_id, "sample_index": sample_index},
            {"$set": embedding_doc},
            upsert=True
        )

        # Count total enrolled samples (checking both canonical and mongo_id for migration safety)
        total_samples = await db.face_embeddings.count_documents({
            "$or": [
                {"student_id": canonical_student_id},
                {"student_id": str(student_mongo_id)}
            ]
        })
        new_status = (
            EnrollmentStatus.ENROLLED
            if total_samples >= min_required
            else EnrollmentStatus.PENDING
        )

        update_fields: Dict = {
            "enrolled_samples_count": total_samples,
            "face_enrollment_status": new_status,
            "updated_at": now
        }
        if not student.get("primary_photo_url") or sample_index == 1:
            update_fields["primary_photo_url"] = upload_res["url"]

        await db.students.update_one(
            {"_id": student_mongo_id},
            {"$set": update_fields}
        )

        # Asynchronously sync in-memory recognition index
        await recognition_index.build_from_database(db)

        # Audit log
        await db.audit_logs.insert_one({
            "user_id": acting_user_id,
            "action": "ENROLL_FACE_SAMPLE",
            "resource_type": "face_embedding",
            "resource_id": canonical_student_id,
            "details": {
                "sample_index": sample_index,
                "total_samples": total_samples,
                "status": new_status,
                "imagekit_url": upload_res["url"]
            },
            "created_at": now,
            "updated_at": now
        })

        return EnrollSampleResponse(
            success=True,
            sample_index=sample_index,
            total_enrolled=total_samples,
            target_samples=target_required,
            quality_score=quality.sharpness_score,
            feedback_message=f"Sample {sample_index} captured and enrolled successfully.",
            face_enrollment_status=new_status,
            imagekit_url=upload_res["url"]
        )

    async def get_student_enrollment_info(
        self,
        db: AsyncIOMotorDatabase,
        student_id: str
    ) -> StudentEnrollmentInfoResponse:
        """Retrieves enrollment status and photo references for a student."""
        min_required, target_required = await self._get_sample_thresholds(db)

        student = await self._find_student(db, student_id)
        if not student:
            raise ValueError(f"Student with ID '{student_id}' does not exist.")

        canonical_student_id = student["student_id"]
        student_mongo_id = student["_id"]

        cursor = db.face_embeddings.find({
            "$or": [
                {"student_id": canonical_student_id},
                {"student_id": str(student_mongo_id)}
            ]
        }).sort("sample_index", 1)
        samples = await cursor.to_list(length=50)
        photo_urls = [s["imagekit_url"] for s in samples if s.get("imagekit_url")]

        return StudentEnrollmentInfoResponse(
            student_id=canonical_student_id,
            full_name=student.get("full_name", ""),
            face_enrollment_status=student.get("face_enrollment_status", EnrollmentStatus.PENDING),
            enrolled_samples_count=len(samples),
            min_required=min_required,
            target_required=target_required,
            photo_urls=photo_urls
        )


    async def delete_student_enrollment(
        self,
        db: AsyncIOMotorDatabase,
        student_id: str,
        acting_user_id: Optional[str] = None
    ) -> bool:
        """Removes all biometric embeddings and ImageKit files for a student."""
        student = await self._find_student(db, student_id)
        if not student:
            return False

        canonical_student_id = student["student_id"]
        student_mongo_id = student["_id"]

        cursor = db.face_embeddings.find({
            "$or": [
                {"student_id": canonical_student_id},
                {"student_id": str(student_mongo_id)}
            ]
        })
        samples = await cursor.to_list(length=50)

        for s in samples:
            fid = s.get("imagekit_file_id")
            if fid:
                await imagekit_service.delete_image(fid)

        await db.face_embeddings.delete_many({
            "$or": [
                {"student_id": canonical_student_id},
                {"student_id": str(student_mongo_id)}
            ]
        })

        now = datetime.now(timezone.utc)
        await db.students.update_one(
            {"_id": student_mongo_id},
            {
                "$set": {
                    "face_enrollment_status": EnrollmentStatus.PENDING,
                    "enrolled_samples_count": 0,
                    "primary_photo_url": None,
                    "updated_at": now
                }
            }
        )

        await recognition_index.build_from_database(db)

        await db.audit_logs.insert_one({
            "user_id": acting_user_id,
            "action": "DELETE_FACE_ENROLLMENT",
            "resource_type": "face_embedding",
            "resource_id": canonical_student_id,
            "details": {"deleted_samples_count": len(samples)},
            "created_at": now,
            "updated_at": now
        })
        return True


face_enrollment_service = FaceEnrollmentService()
