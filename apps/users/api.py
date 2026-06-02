import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.users.exceptions import UserError
from apps.users.models.user import User
from apps.users.schemas.requests import UpdateUserRequest
from apps.users.schemas.responses import UserResponse
from apps.users.services.command import UserCommandService
from apps.users.services.query import UserQueryService
from core.database import get_session
from core.dependencies import get_current_user
from core.schemas import ErrorResponse


router = APIRouter(tags=["users"])


@router.get(
    "/",
    response_model=UserResponse,
    responses={
        400: {
            "model": ErrorResponse,
            "description": "user_id or username missing / mutually exclusive"
        },
        404: {"model": ErrorResponse, "description": "User not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def get_user(
        user_id: uuid.UUID | None = None,
        username: str | None = None,
        session: AsyncSession = Depends(get_session),
) -> UserResponse:
    if user_id is None and username is None:
        raise UserError.ID_OR_USERNAME_REQUIRED
    if user_id is not None and username is not None:
        raise UserError.ID_AND_USERNAME_EXCLUSIVE
    if user_id is not None:
        user = await UserQueryService(session).get_by_id(user_id)
    else:
        user = await UserQueryService(session).get_by_username(username)
    if user is None:
        raise UserError.NOT_FOUND
    return user


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing access token"},
        403: {"model": ErrorResponse, "description": "No bearer token provided"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing access token"},
        403: {"model": ErrorResponse, "description": "No bearer token provided"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def update_me(
        payload: UpdateUserRequest,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
) -> UserResponse:
    return await UserCommandService(session).update_user(
        current_user, language=payload.language
    )
