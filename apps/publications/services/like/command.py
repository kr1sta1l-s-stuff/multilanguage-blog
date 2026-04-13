import uuid

from sqlalchemy import select as _sa_select

from apps.publications.models import Like
from core.base_service import AbstractBaseService

from datetime import datetime


class LikeCommandService(AbstractBaseService):
    async def create(
        self,
        publication_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        stmt = await self.session.execute(
            _sa_select(Like).where(
                Like.publication_id == publication_id,
                Like.user_id == user_id,
            )
        )
        like = stmt.scalar_one_or_none()
        if like:
            like.deleted_at = None
            like.updated_at = datetime.now()
            self.session.add(like)
            await self.session.commit()
        else:
            like = Like(
                publication_id=publication_id,
                user_id=user_id,
            )
            self.session.add(like)
            await self.session.commit()

    async def delete(self, publication_id: uuid.UUID, user_id: uuid.UUID) -> None:
        stmt = await self.session.execute(
            _sa_select(Like).where(
                Like.publication_id == publication_id,
                Like.deleted_at.is_(None),
                Like.user_id == user_id,
            )
        )
        like = stmt.scalar_one_or_none()
        if like:
            like.deleted_at = datetime.now()
            self.session.add(like)
            await self.session.commit()
