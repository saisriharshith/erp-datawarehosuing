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
