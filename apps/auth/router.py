from fastapi import APIRouter, Depends, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from apps.auth.schemas.requests import LoginRequest, RefreshRequest, RegisterRequest
from apps.auth.schemas.responses import TokenResponse
from apps.auth.services.command import AuthCommandService
from apps.users.schemas.responses import UserResponse
from core.database import get_session
from core.redis import get_redis
from core.schemas import ErrorResponse


router = APIRouter(tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"model": ErrorResponse, "description": "Username already taken"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_session),
    redis: Redis = Depends(get_redis),
):
    return await AuthCommandService(session, redis).register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def login(
    data: LoginRequest,
    session: AsyncSession = Depends(get_session),
    redis: Redis = Depends(get_redis),
):
    return await AuthCommandService(session, redis).login(data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or expired refresh token"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def refresh(
    data: RefreshRequest,
    redis: Redis = Depends(get_redis),
):
    return await AuthCommandService(None, redis).refresh(data.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or expired refresh token"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def logout(
    data: RefreshRequest,
    redis: Redis = Depends(get_redis),
):
    await AuthCommandService(None, redis).logout(data.refresh_token)
