"""
Image Processing, Decoding, and Quality Assessment Utilities
"""

import base64
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
from ..schemas.enrollment import FaceQualityMetrics


def decode_base64_to_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Decodes a base64 string (with or without data URI header) into an OpenCV BGR numpy array.
    """
    try:
        if not base64_string:
            return None
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,", 1)[1]

        image_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def encode_image_to_base64(img: np.ndarray, quality: int = 90) -> str:
    """Encodes an OpenCV image to a base64 string."""
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode(".jpg", img, encode_param)
    return base64.b64encode(buffer).decode("utf-8")


def calculate_sharpness(gray_img: np.ndarray) -> float:
    """Calculates image sharpness using variance of the Laplacian."""
    if gray_img is None or gray_img.size == 0:
        return 0.0
    return float(cv2.Laplacian(gray_img, cv2.CV_64F).var())


def calculate_brightness(gray_img: np.ndarray) -> float:
    """Calculates mean brightness score [0, 255]."""
    if gray_img is None or gray_img.size == 0:
        return 0.0
    return float(np.mean(gray_img))


def assess_face_quality(
    frame: np.ndarray,
    face_box: Optional[List[int]],
    faces_count: int
) -> FaceQualityMetrics:
    """
    Validates face quality metrics for enrollment and recognition.
    Generates actionable user-facing feedback messages.
    """
    if faces_count == 0 or face_box is None:
        return FaceQualityMetrics(
            is_valid=False,
            faces_detected=0,
            sharpness_score=0.0,
            brightness_score=0.0,
            face_area_ratio=0.0,
            feedback_message="No face detected. Please face the camera directly."
        )

    if faces_count > 1:
        return FaceQualityMetrics(
            is_valid=False,
            faces_detected=faces_count,
            sharpness_score=0.0,
            brightness_score=0.0,
            face_area_ratio=0.0,
            feedback_message="Only one person should be visible. Multiple faces detected."
        )

    h_frame, w_frame = frame.shape[:2]
    x1, y1, x2, y2 = face_box
    # Clip coordinates
    x1 = max(0, min(x1, w_frame - 1))
    y1 = max(0, min(y1, h_frame - 1))
    x2 = max(x1 + 1, min(x2, w_frame))
    y2 = max(y1 + 1, min(y2, h_frame))

    face_w = x2 - x1
    face_h = y2 - y1
    face_area = face_w * face_h
    frame_area = w_frame * h_frame
    face_ratio = face_area / float(frame_area)

    face_crop = frame[y1:y2, x1:x2]
    gray_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

    sharpness = calculate_sharpness(gray_face)
    brightness = calculate_brightness(gray_face)

    # Centering check
    face_cx = (x1 + x2) / 2.0
    face_cy = (y1 + y2) / 2.0
    center_dx = (face_cx - (w_frame / 2.0)) / float(w_frame)
    center_dy = (face_cy - (h_frame / 2.0)) / float(h_frame)

    # Validation criteria
    feedback = "Face detected — ready to capture."
    is_valid = True

    if face_ratio < 0.05:
        feedback = "Move closer to the camera."
        is_valid = False
    elif face_ratio > 0.85:
        feedback = "Move slightly back from the camera."
        is_valid = False
    elif center_dx > 0.25:
        feedback = "Move slightly to your left (camera's right)."
        is_valid = False
    elif center_dx < -0.25:
        feedback = "Move slightly to your right (camera's left)."
        is_valid = False
    elif brightness < 40.0:
        feedback = "Improve lighting. Face is too dark."
        is_valid = False
    elif brightness > 225.0:
        feedback = "Reduce glare or strong backlight."
        is_valid = False
    elif sharpness < 40.0:
        feedback = "Hold still. Camera is blurry."
        is_valid = False

    return FaceQualityMetrics(
        is_valid=is_valid,
        faces_detected=1,
        sharpness_score=round(sharpness, 2),
        brightness_score=round(brightness, 2),
        face_area_ratio=round(face_ratio, 4),
        feedback_message=feedback
    )
