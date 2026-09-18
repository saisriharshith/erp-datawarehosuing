"""
FastAPI Main Application Entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .api.v1 import api_v1_router
from .core.config import settings
from .core.database import close_mongo_connection, connect_to_mongo, db_manager, get_database
from .core.logging import logger
from .middleware.security_headers import SecurityHeadersMiddleware
from .services.face_recognition import recognition_index
from .services.imagekit_service import imagekit_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: connects database and initializes in-memory vector index."""
    logger.info("Booting AI Face Recognition Attendance System backend...")
    await connect_to_mongo()

    # Preload enrolled face recognition vector index
    try:
        db = get_database()
        await recognition_index.build_from_database(db)
    except Exception as e:
        logger.warning(f"Could not preload recognition index on startup: {e}")

    logger.info("Application startup sequence completed.")
    yield
    logger.info("Shutting down application...")
    await close_mongo_connection()
    logger.info("Shutdown completed.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Modern SaaS College Attendance Management System powered by InsightFace, FastAPI, and MongoDB.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers & Processing Time
app.add_middleware(SecurityHeadersMiddleware)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail
            }
        },
        headers=exc.headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        msg = err.get("msg", "Validation error")
        errors.append(f"{loc}: {msg}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Input validation failed.",
                "details": errors
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": "An internal server error occurred. Please try again."
            }
        }
    )


# Mount API Routers
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    db_healthy = False
    try:
        db = get_database()
        db_healthy = db is not None
    except Exception:
        db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "database_storage": "live_mongodb_atlas" if not db_manager.is_mock else "in_memory_mock",
        "database_name": settings.MONGODB_DATABASE,
        "imagekit_storage": "live_imagekit" if imagekit_service.is_configured else "simulated_mock",
        "face_engine_ready": recognition_index is not None,
        "environment": settings.ENVIRONMENT
    }
