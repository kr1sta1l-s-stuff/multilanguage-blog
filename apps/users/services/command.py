import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from apps.users.models.password import Password
from apps.users.models.user import User


class UserCommandService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_user(self, username: str) -> User:
        user = User(username=username)
        self.session.add(user)
        await self.session.flush()
        return user

    async def create_password(self, user_id: uuid.UUID, password_hash: str) -> Password:
        password = Password(user_id=user_id, password_hash=password_hash)
        self.session.add(password)
        await self.session.flush()
        return password
