import uuid

from apps.users.models.password import Password
from apps.users.models.user import User
from core.base_service import AbstractBaseService
from core.database import select


class UserQueryService(AbstractBaseService):
    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_password_by_user_id(self, user_id: uuid.UUID) -> Password | None:
        result = await self.session.execute(
            select(Password).where(Password.user_id == user_id)
        )
        return result.scalar_one_or_none()
