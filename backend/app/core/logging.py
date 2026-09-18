"""
Structured Logging Configuration
"""

import logging
import sys
from .config import settings


def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("onnxruntime").setLevel(logging.WARNING)

    logger = logging.getLogger("attendance_system")
    logger.info(f"Logging initialized at level: {logging.getLevelName(log_level)}")
    return logger


logger = setup_logging()
