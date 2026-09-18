"""
Authentication API Endpoints
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...core.security import create_access_token, verify_password
from ...models.user import UserModel, UserRole
from ...schemas.auth import LoginRequest, TokenResponse, UserResponse
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Authenticate user with email and password, issuing a signed JWT access token."""
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact administrator."
        )

    user_id = str(user["_id"])
    token_payload = {
        "sub": user_id,
        "email": user["email"],
        "role": user["role"],
        "full_name": user.get("full_name", "")
    }
    token = create_access_token(data=token_payload)

    # Record login audit
    await db.audit_logs.insert_one({
        "user_id": user_id,
        "user_email": user["email"],
        "user_role": user["role"],
        "action": "USER_LOGIN",
        "resource_type": "user",
        "resource_id": user_id,
        "details": {"timestamp": datetime.now(timezone.utc).isoformat()},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user["role"],
        user_id=user_id,
        full_name=user.get("full_name", ""),
        email=user["email"]
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: UserModel = Depends(get_current_user)
):
    """Returns currently authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url
    )
