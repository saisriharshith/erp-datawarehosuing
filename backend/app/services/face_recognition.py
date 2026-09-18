"""
Face Recognition Service and In-Memory Vector Search Index
Implements multi-sample candidate matching, score aggregation, and configurable thresholding.
"""

from typing import Dict, List, Optional, Tuple
import asyncio
import numpy as np
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.config import settings
from ..core.logging import logger


class RecognitionMatch:
    def __init__(
        self,
        student_id: Optional[str],
        student_name: Optional[str],
        registration_number: Optional[str],
        similarity_score: float,
        is_recognized: bool
    ):
        self.student_id = student_id
        self.student_name = student_name
        self.registration_number = registration_number
        self.similarity_score = round(similarity_score, 4)
        self.is_recognized = is_recognized


class RecognitionIndex:
    """
    High-performance in-memory index storing 512-D ArcFace normalized embeddings.
    Avoids expensive database queries during continuous video frame processing.
    """
    def __init__(self):
        self.lock = asyncio.Lock()
        self.embeddings_matrix: Optional[np.ndarray] = None  # Shape (M, 512)
        self.sample_student_ids: List[str] = []              # Maps row index -> student_id
        self.student_names: Dict[str, str] = {}              # student_id -> full_name
        self.student_reg_numbers: Dict[str, str] = {}        # student_id -> registration_number
        self.total_students: int = 0
        self.total_samples: int = 0

    async def build_from_database(self, db: AsyncIOMotorDatabase):
        """
        Loads all enrolled student embeddings from MongoDB and builds the matrix.
        """
        async with self.lock:
            logger.info("Rebuilding in-memory recognition index from MongoDB...")
            
            # Fetch all students for metadata
            students_cursor = db.students.find({}, {"student_id": 1, "full_name": 1})
            students_list = await students_cursor.to_list(length=100000)
            name_map = {s["student_id"]: s.get("full_name", s["student_id"]) for s in students_list}
            reg_map = {s["student_id"]: s.get("student_id") for s in students_list}

            # Fetch all face embeddings
            embeddings_cursor = db.face_embeddings.find({}, {"student_id": 1, "embedding": 1})
            docs = await embeddings_cursor.to_list(length=200000)

            if not docs:
                self.embeddings_matrix = None
                self.sample_student_ids = []
                self.student_names = name_map
                self.student_reg_numbers = reg_map
                self.total_students = len(name_map)
                self.total_samples = 0
                logger.info("Recognition index built with 0 enrolled face samples.")
                return

            matrix_list = []
            sample_ids = []

            for doc in docs:
                emb = doc.get("embedding")
                sid = doc.get("student_id")
                if emb and len(emb) == 512 and sid:
                    arr = np.array(emb, dtype=np.float32)
                    norm = np.linalg.norm(arr)
                    if norm > 1e-6:
                        arr = arr / norm
                    matrix_list.append(arr)
                    sample_ids.append(sid)

            if matrix_list:
                self.embeddings_matrix = np.vstack(matrix_list)  # (M, 512)
                self.sample_student_ids = sample_ids
                self.student_names = name_map
                self.student_reg_numbers = reg_map
                self.total_samples = len(sample_ids)
                self.total_students = len(set(sample_ids))
                logger.info(
                    f"Recognition index ready: {self.total_samples} samples across "
                    f"{self.total_students} unique enrolled students."
                )
            else:
                self.embeddings_matrix = None
                self.sample_student_ids = []
                self.total_samples = 0

    def match_face(
        self,
        query_embedding: List[float],
        threshold: Optional[float] = None
    ) -> RecognitionMatch:
        """
        Compares a single query face embedding against the enrolled index.
        Aggregates multiple samples per student using max-similarity with top-2 smoothing.
        Returns a RecognitionMatch object.
        """
        effective_threshold = threshold if threshold is not None else settings.FACE_SIMILARITY_THRESHOLD

        if self.embeddings_matrix is None or len(self.sample_student_ids) == 0:
            return RecognitionMatch(
                student_id=None,
                student_name=None,
                registration_number=None,
                similarity_score=0.0,
                is_recognized=False
            )

        q = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q)
        if q_norm > 1e-6:
            q = q / q_norm

        # Vectorized dot product against all M enrolled vectors: (M,)
        raw_similarities = np.dot(self.embeddings_matrix, q)

        # Aggregate multi-sample scores by student_id
        student_scores: Dict[str, List[float]] = {}
        for i, sid in enumerate(self.sample_student_ids):
            score = float(raw_similarities[i])
            if sid not in student_scores:
                student_scores[sid] = []
            student_scores[sid].append(score)

        best_student_id: Optional[str] = None
        best_aggregated_score: float = -1.0

        for sid, scores in student_scores.items():
            # If multiple samples, take the top sample or mean of top 2
            sorted_scores = sorted(scores, reverse=True)
            if len(sorted_scores) >= 2:
                # 70% best sample + 30% second best sample for robust outlier rejection
                agg_score = 0.70 * sorted_scores[0] + 0.30 * sorted_scores[1]
            else:
                agg_score = sorted_scores[0]

            if agg_score > best_aggregated_score:
                best_aggregated_score = agg_score
                best_student_id = sid

        if best_aggregated_score >= effective_threshold and best_student_id is not None:
            name = self.student_names.get(best_student_id, best_student_id)
            reg_num = self.student_reg_numbers.get(best_student_id, best_student_id)
            return RecognitionMatch(
                student_id=best_student_id,
                student_name=name,
                registration_number=reg_num,
                similarity_score=best_aggregated_score,
                is_recognized=True
            )

        return RecognitionMatch(
            student_id=None,
            student_name="Unknown Student",
            registration_number=None,
            similarity_score=max(0.0, best_aggregated_score),
            is_recognized=False
        )


recognition_index = RecognitionIndex()
