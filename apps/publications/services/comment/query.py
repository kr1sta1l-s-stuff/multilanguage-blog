import uuid

from sqlalchemy.orm import joinedload
from sqlalchemy.sql import Select

from apps.publications.models import Comment
from core.base_service import AbstractBaseService
from core.database import select


class CommentQueryService(AbstractBaseService):
    async def get_by_publication_id(self, publication_id: uuid.UUID) -> Select:
        return (
            select(Comment)
            .where(Comment.publication_id == publication_id)
            .order_by(Comment.created_at.desc())
            .options(joinedload(Comment.author))
        )

    async def get_by_id(self, comment_id: uuid.UUID) -> Comment | None:
        return (await self.session.execute(
            select(Comment)
            .where(Comment.id == comment_id)
            .options(joinedload(Comment.author))
        )).scalar_one_or_none()
