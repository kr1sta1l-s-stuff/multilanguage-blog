import uuid
from datetime import datetime

from sqlalchemy import select as _sa_select

from apps.publications.models import Like, Publication
from core.base_service import AbstractBaseService


class LikeCommandService(AbstractBaseService):
    async def create(
        self,
        publication: Publication,
        user_id: uuid.UUID,
    ) -> None:
        stmt = await self.session.execute(
            _sa_select(Like).where(
                Like.publication_id == publication.id,
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
                publication_id=publication.id,
                user_id=user_id,
            )
            self.session.add(like)
            await self.session.commit()

    async def delete(self, publication: Publication, user_id: uuid.UUID) -> None:
        stmt = await self.session.execute(
            _sa_select(Like).where(
                Like.publication_id == publication.id,
                Like.deleted_at.is_(None),
                Like.user_id == user_id,
            )
        )
        like = stmt.scalar_one_or_none()
        if like:
            like.deleted_at = datetime.now()
            self.session.add(like)
            await self.session.commit()
