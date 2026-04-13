import uuid

from sqlalchemy import exists, func, literal
from sqlalchemy.orm import joinedload, with_expression
from sqlalchemy.sql import Select

from apps.publications.models import Comment, Like, Publication
from core.base_service import AbstractBaseService
from core.database import select


class PublicationQueryService(AbstractBaseService):
    async def get_all_published(self, user_id: uuid.UUID | None = None) -> Select:
        return self._enrich_publication_with_is_liked(
            self._enrich_publication_with_comments_count(
                self._enrich_publication_with_likes_count(
                    select(Publication)
                    .where(Publication.published_at.isnot(None))
                    .order_by(Publication.published_at.desc())
                    .options(joinedload(Publication.images))
                )
            ),
            user_id,
        )

    async def get_by_id(self, publication_id: uuid.UUID, user_id: uuid.UUID | None = None) -> Publication | None:
        stmt = (
            select(Publication)
            .where(Publication.id == publication_id)
            .order_by(Publication.created_at.desc())
            .options(joinedload(Publication.images))
        )
        result = await self.session.execute(
            self._enrich_publication_with_is_liked(
                self._enrich_publication_with_comments_count(
                    self._enrich_publication_with_likes_count(stmt)
                ),
                user_id,
            )
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

    @staticmethod
    def _enrich_publication_with_likes_count(query: Select) -> Select:
        likes_count_subquery = (
            select(func.count(Like.id))
            .where(Like.publication_id == Publication.id)
            .scalar_subquery()
        )
        return query.options(with_expression(Publication.likes_count, likes_count_subquery))

    @staticmethod
    def _enrich_publication_with_is_liked(query: Select, user_id: uuid.UUID | None) -> Select:
        if user_id is None:
            is_liked_expr = literal(False)
        else:
            is_liked_expr = exists(
                select(Like.id).where(
                    Like.publication_id == Publication.id,
                    Like.user_id == user_id,
                    Like.deleted_at.is_(None),
                )
            )
        return query.options(with_expression(Publication.is_liked, is_liked_expr))
