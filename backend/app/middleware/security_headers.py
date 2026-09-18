"""
Security Headers and Global Error Handling Middleware
"""

import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response: Response = await call_next(request)
        process_time = time.time() - start_time
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Process-Time"] = f"{process_time * 1000:.2f}ms"
        return response
