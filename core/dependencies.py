import uuid

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from apps.auth.exceptions import AuthError
from apps.users.exceptions import UserError
from apps.users.models.user import User
from apps.users.services.query import UserQueryService
from core.database import get_session
from core.security import decode_token


bearer_scheme = HTTPBearer()


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
