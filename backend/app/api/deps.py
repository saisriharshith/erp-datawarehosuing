"""
FastAPI Dependencies: Database injection, JWT authentication, and RBAC authorization.
"""

from typing import Callable, List, Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.database import get_database
from ..core.security import decode_access_token
from ..models.user import UserModel, UserRole

security_bearer = HTTPBearer(auto_error=False)


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency providing MongoDB database handle."""
    return get_database()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserModel:
    """Validates JWT access token and retrieves the current authenticated user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_doc = await db.users.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else await db.users.find_one({"email": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    user_doc["_id"] = str(user_doc["_id"])
    return UserModel(**user_doc)


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Factory dependency for role-based access control.
    Enforces authorization strictly on the backend.
    """
    async def role_checker(
        current_user: UserModel = Depends(get_current_user)
    ) -> UserModel:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles."
            )
        return current_user
    return role_checker


# Convenient role guards
require_admin = require_role([UserRole.ADMIN])
require_lecturer_or_admin = require_role([UserRole.LECTURER, UserRole.ADMIN])
