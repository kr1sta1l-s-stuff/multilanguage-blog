import uuid
from typing import Callable

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from apps.auth.exceptions import AuthError
from apps.users.exceptions import UserError
from apps.users.models.user import User
from apps.users.services.query import UserQueryService
from core.base_service import AbstractBaseService
from core.database import get_session
from core.security import decode_token


bearer_scheme = HTTPBearer()


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    if credentials is None:
        return None
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        return None

    return await UserQueryService(session).get_by_id(user_id)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise AuthError.INVALID_TOKEN

    user = await UserQueryService(session).get_by_id(user_id)
    if not user:
        raise UserError.NOT_FOUND

    return user


def get_command_query_service(
    command_query_type: type[AbstractBaseService]
) -> Callable[[AsyncSession], AbstractBaseService]:
    """
    Creates and returns a service that handles commands or queries
    based on the specified `command_query_type`.

    Args:
        command_query_type: The service class to be created. This class should inherit from
            the abstract base class `AbstractBaseService`

    Returns:
        Created specified class to access database
    """
    def _get_service(session: AsyncSession = Depends(get_session)) -> AbstractBaseService:
        return command_query_type(session)

    return _get_service
