"""
Backend Application Configuration
---------------------------------
Loads environment variables and configures Flask runtime settings.
"""

import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Config:
    """Application configuration parameters."""
    SECRET_KEY = os.getenv("SECRET_KEY", "erp-warehouse-secret-key-2026")
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    PORT = int(os.getenv("PORT", 5001))

    # MongoDB Configuration
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    SOURCE_DB_NAME = os.getenv("SOURCE_DB_NAME", "erp_source")
    WAREHOUSE_DB_NAME = os.getenv("WAREHOUSE_DB_NAME", "erp_warehouse")

    # CORS Allowed Origins
    FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
