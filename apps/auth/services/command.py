from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from apps.auth.exceptions import AuthError
from apps.auth.schemas.requests import LoginRequest, RegisterRequest
from apps.auth.schemas.responses import TokenResponse
from apps.auth.services.query import AuthQueryService
from apps.users.exceptions import UserError
from apps.users.schemas.responses import UserResponse
from apps.users.services.command import UserCommandService
from apps.users.services.query import UserQueryService
from core.config import settings
from core.security import create_access_token, create_refresh_token, hash_password, verify_password


class AuthCommandService:
    def __init__(self, session: AsyncSession, redis: Redis):
        self.session = session
        self.redis = redis
        self._query = UserQueryService(session)
        self._command = UserCommandService(session)
        self._auth_query = AuthQueryService(redis)

    async def register(self, data: RegisterRequest) -> UserResponse:
        if await self._query.get_by_username(data.username):
            raise UserError.USERNAME_TAKEN

        user = await self._command.create_user(data.username)
        await self._command.create_password(user.id, hash_password(data.password))
        await self.session.commit()
        await self.session.refresh(user)
        return UserResponse.model_validate(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self._query.get_by_username(data.username)
        if not user:
            raise AuthError.INVALID_CREDENTIALS

        password = await self._query.get_password_by_user_id(user.id)
        if not password or not verify_password(data.password, password.password_hash):
            raise AuthError.INVALID_CREDENTIALS

        user_id = str(user.id)
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)

        ttl = settings.jwt_refresh_token_expire_days * 86400
        await self.redis.set(f"refresh:{refresh_token}", user_id, ex=ttl)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        user_id = await self._auth_query.get_user_id_by_refresh_token(refresh_token)
        if not user_id:
            raise AuthError.INVALID_REFRESH_TOKEN

        await self.redis.delete(f"refresh:{refresh_token}")

        new_access_token = create_access_token(user_id)
        new_refresh_token = create_refresh_token(user_id)
        ttl = settings.jwt_refresh_token_expire_days * 86400
        await self.redis.set(f"refresh:{new_refresh_token}", user_id, ex=ttl)

        return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)

    async def logout(self, refresh_token: str) -> None:
        await self.redis.delete(f"refresh:{refresh_token}")
