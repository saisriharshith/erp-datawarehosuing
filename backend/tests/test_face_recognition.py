"""
Face Recognition, Embeddings, and Indexing Unit Tests
"""

import numpy as np
import pytest
from backend.app.services.face_engine import FaceEngine
from backend.app.services.face_recognition import RecognitionIndex, recognition_index


def test_cosine_similarity_mathematics():
    # Two identical vectors -> similarity = 1.0
    v1 = np.random.randn(512).astype(np.float32)
    v1 = v1 / np.linalg.norm(v1)
    sim_self = FaceEngine.compute_cosine_similarity(v1, v1)
    assert abs(sim_self - 1.0) < 1e-4

    # Orthogonal vectors -> similarity ~ 0.0
    v_ortho = np.random.randn(512).astype(np.float32)
    v_ortho -= v_ortho.dot(v1) * v1
    v_ortho = v_ortho / np.linalg.norm(v_ortho)
    sim_ortho = FaceEngine.compute_cosine_similarity(v1, v_ortho)
    assert abs(sim_ortho) < 1e-4


@pytest.mark.asyncio
async def test_recognition_index_multi_sample_matching(init_test_db):
    db = init_test_db
    index = RecognitionIndex()

    # Create 2 students in DB
    await db.students.insert_one({"student_id": "STUDENT_1", "full_name": "Alice", "email": "alice@college.edu"})
    await db.students.insert_one({"student_id": "STUDENT_2", "full_name": "Bob", "email": "bob@college.edu"})

    # Create base vectors for Alice and Bob
    alice_base = np.random.randn(512).astype(np.float32)
    alice_base = alice_base / np.linalg.norm(alice_base)

    bob_base = np.random.randn(512).astype(np.float32)
    bob_base = bob_base / np.linalg.norm(bob_base)

    def random_unit():
        v = np.random.randn(512).astype(np.float32)
        return v / np.linalg.norm(v)

    # Insert 3 samples for Alice with slight variance (dot product ~ 0.95)
    for i in range(3):
        noise = 0.95 * alice_base + 0.05 * random_unit()
        norm_noise = (noise / np.linalg.norm(noise)).tolist()
        await db.face_embeddings.insert_one({
            "student_id": "STUDENT_1",
            "embedding": norm_noise,
            "sample_index": i + 1
        })

    # Insert 2 samples for Bob
    for i in range(2):
        noise = 0.95 * bob_base + 0.05 * random_unit()
        norm_noise = (noise / np.linalg.norm(noise)).tolist()
        await db.face_embeddings.insert_one({
            "student_id": "STUDENT_2",
            "embedding": norm_noise,
            "sample_index": i + 1
        })

    # Build index from database
    await index.build_from_database(db)
    assert index.total_samples == 5
    assert index.total_students == 2

    # Query with a probe vector of Alice
    alice_probe = 0.92 * alice_base + 0.08 * random_unit()
    alice_probe = (alice_probe / np.linalg.norm(alice_probe)).tolist()
    match_alice = index.match_face(alice_probe, threshold=0.60)
    assert match_alice.is_recognized is True
    assert match_alice.student_id == "STUDENT_1"
    assert match_alice.student_name == "Alice"
    assert match_alice.similarity_score > 0.85

    # Query with a probe vector of Bob
    bob_probe = 0.92 * bob_base + 0.08 * random_unit()
    bob_probe = (bob_probe / np.linalg.norm(bob_probe)).tolist()
    match_bob = index.match_face(bob_probe, threshold=0.60)
    assert match_bob.is_recognized is True
    assert match_bob.student_id == "STUDENT_2"
    assert match_bob.student_name == "Bob"

    # Query with an unknown random vector
    unknown_probe = np.random.randn(512).astype(np.float32)
    unknown_probe = (unknown_probe / np.linalg.norm(unknown_probe)).tolist()
    match_unknown = index.match_face(unknown_probe, threshold=0.60)
    assert match_unknown.is_recognized is False
    assert match_unknown.student_id is None
    assert match_unknown.student_name == "Unknown Student"
