import uuid

from sqlalchemy import and_, exists, or_
from sqlalchemy import select as _sa_select
from sqlalchemy.orm import aliased, joinedload
from sqlalchemy.sql import Select

from apps.publications.models import Comment
from core.base_service import AbstractBaseService
from core.database import select


class CommentQueryService(AbstractBaseService):
    async def get_by_publication_id(self, publication_id: uuid.UUID) -> Select:
        reply = aliased(Comment)
        has_alive_reply = exists(
            _sa_select(reply.id)
            .where(
                reply.thread_id == Comment.id,
                reply.deleted_at.is_(None),
            )
            .correlate(Comment)
        )
        return (
            _sa_select(Comment)
            .where(Comment.publication_id == publication_id)
            .where(
                or_(
                    Comment.deleted_at.is_(None),
                    and_(Comment.thread_id.is_(None), has_alive_reply),
                )
            )
            .order_by(Comment.created_at.desc())
            .options(joinedload(Comment.author))
        )

    async def get_by_id(self, comment_id: uuid.UUID) -> Comment | None:
        return (await self.session.execute(
            select(Comment)
            .where(Comment.id == comment_id)
            .options(joinedload(Comment.author))
        )).scalar_one_or_none()

    async def get_thread(self, comment_id: uuid.UUID) -> list[Comment]:
        comment = await self.get_by_id(comment_id)
        if comment is None:
            return []
        root_id = comment.thread_id or comment.id

        reply = aliased(Comment)
        has_alive_reply = exists(
            _sa_select(reply.id)
            .where(
                reply.thread_id == Comment.id,
                reply.deleted_at.is_(None),
            )
            .correlate(Comment)
        )
        rows = (await self.session.execute(
            select(Comment)
            .where(or_(Comment.id == root_id, Comment.thread_id == root_id))
            .where(
                or_(
                    Comment.deleted_at.is_(None),
                    and_(Comment.thread_id.is_(None), has_alive_reply),
                )
            )
            .order_by(Comment.created_at.asc())
            .options(joinedload(Comment.author))
        )).scalars().all()

        # Root first, then replies in chronological order.
        return sorted(rows, key=lambda c: (c.thread_id is not None, c.created_at))
