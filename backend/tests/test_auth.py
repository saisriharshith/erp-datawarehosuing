"""
Authentication & Authorization Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_login_success(client: AsyncClient, admin_auth):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_admin@college.edu", "password": "AdminPass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["email"] == "test_admin@college.edu"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, admin_auth):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_admin@college.edu", "password": "WrongPassword"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@college.edu", "password": "AnyPassword"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, admin_auth):
    headers = {"Authorization": admin_auth["Authorization"]}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_admin@college.edu"
    assert data["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_lecturer_cannot_access_admin_endpoint(client: AsyncClient, lecturer_auth):
    headers = {"Authorization": lecturer_auth["Authorization"]}
    # Attempting to access admin settings endpoint with lecturer token
    response = await client.get("/api/v1/admin/settings", headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_change_password(client: AsyncClient, admin_auth):
    headers = {"Authorization": admin_auth["Authorization"]}

    # 1. Reject invalid old password
    bad_old_res = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"old_password": "WrongOldPassword", "new_password": "NewSecretPass123"}
    )
    assert bad_old_res.status_code == 400

    # 2. Reject short new password (< 6 chars)
    short_res = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"old_password": "AdminPass123", "new_password": "123"}
    )
    assert short_res.status_code == 400 or short_res.status_code == 422

    # 3. Successfully change password
    change_res = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"old_password": "AdminPass123", "new_password": "UpdatedAdminPass789"}
    )
    assert change_res.status_code == 200

    # 4. Verify new password login succeeds
    login_new = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_admin@college.edu", "password": "UpdatedAdminPass789"}
    )
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()

    # 5. Verify old password login now fails
    login_old = await client.post(
        "/api/v1/auth/login",
        json={"email": "test_admin@college.edu", "password": "AdminPass123"}
    )
    assert login_old.status_code == 401

