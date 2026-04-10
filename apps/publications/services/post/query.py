import uuid

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, with_expression
from sqlalchemy.sql import Select

from apps.publications.models import Comment, Publication
from core.database import select


class PublicationQueryService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> Select:
        return (
            self._enrich_publication_with_comments_count(
                select(Publication).options(joinedload(Publication.images))
            )
        )

    async def get_by_id(self, publication_id: uuid.UUID) -> Publication | None:
        stmt = (
            select(Publication)
            .where(Publication.id == publication_id)
            .order_by(Publication.created_at.desc())
            .options(joinedload(Publication.images))
        )
        result = await self.session.execute(
            self._enrich_publication_with_comments_count(stmt)
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _enrich_publication_with_comments_count(query: Select) -> Select:
        comments_count_subquery = (
            select(func.count(Comment.id))
            .where(Comment.publication_id == Publication.id)
            .scalar_subquery()
        )
        return query.options(with_expression(Publication.comments_count, comments_count_subquery))
