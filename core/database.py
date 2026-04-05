from collections.abc import AsyncGenerator

from sqlalchemy import select as _sa_select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.sql import Select

from core.config import settings
from core.models import SoftDeleteMixin


engine = create_async_engine(settings.database_url, echo=settings.app_debug)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


def select(*entities, **kwargs) -> Select:
    stmt = _sa_select(*entities, **kwargs)
    for entity in entities:
        if isinstance(entity, type) and issubclass(entity, SoftDeleteMixin):
            stmt = stmt.where(entity.deleted_at.is_(None))
    return stmt


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
