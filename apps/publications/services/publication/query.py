import uuid

from sqlalchemy import exists, func, literal, or_
from sqlalchemy.orm import joinedload, selectinload, with_expression
from sqlalchemy.sql import Select

from apps.publications.models import Comment, Like, Publication, PublicationTag, Tag
from core.base_service import AbstractBaseService
from core.database import select


class PublicationQueryService(AbstractBaseService):
    async def get_all_published(
        self,
        user_id: uuid.UUID | None = None,
        tag_slugs: list[str] | None = None,
        search: str | None = None,
    ) -> Select:
        stmt = (
            select(Publication)
            .where(Publication.published_at.isnot(None))
            .options(joinedload(Publication.images), selectinload(Publication.tags))
        )
        if tag_slugs:
            stmt = self._filter_by_tag_slugs(stmt, tag_slugs)
        search = (search or "").strip()
        if search:
            stmt = self._filter_and_rank_by_search(stmt, search)
        else:
            stmt = stmt.order_by(Publication.published_at.desc())
        return self._enrich_publication_with_is_liked(
            self._enrich_publication_with_comments_count(
                self._enrich_publication_with_likes_count(stmt)
            ),
            user_id,
        )

    async def get_drafts(self, author_id: uuid.UUID) -> Select:
        stmt = (
            select(Publication)
            .where(Publication.author_id == author_id)
            .where(Publication.published_at.is_(None))
            .order_by(Publication.created_at.desc())
            .options(joinedload(Publication.images), selectinload(Publication.tags))
        )
        return self._enrich_publication_with_is_liked(
            self._enrich_publication_with_comments_count(
                self._enrich_publication_with_likes_count(stmt)
            ),
            author_id,
        )

    async def get_by_id(self, publication_id: uuid.UUID, user_id: uuid.UUID | None = None) -> Publication | None:
        stmt = (
            select(Publication)
            .where(Publication.id == publication_id)
            .order_by(Publication.created_at.desc())
            .options(joinedload(Publication.images), selectinload(Publication.tags))
        )
        result = await self.session.execute(
            self._enrich_publication_with_is_liked(
                self._enrich_publication_with_comments_count(
                    self._enrich_publication_with_likes_count(stmt)
                ),
                user_id,
            )
        )
        return result.unique().scalar_one_or_none()

    @staticmethod
    def _filter_and_rank_by_search(query: Select, search: str) -> Select:
        like_pattern = f"%{search}%"
        title_sim = func.word_similarity(search, Publication.title)
        content_sim = func.word_similarity(search, Publication.content)
        title_threshold = 0.3 if len(search) >= 4 else 0.5
        content_threshold = 0.25 if len(search) >= 4 else 0.4
        return (
            query
            .where(
                or_(
                    Publication.title.ilike(like_pattern),
                    Publication.content.ilike(like_pattern),
                    title_sim > title_threshold,
                    content_sim > content_threshold,
                )
            )
            .order_by(
                func.greatest(title_sim * 2, content_sim).desc(),
                Publication.published_at.desc(),
            )
        )

    @staticmethod
    def _filter_by_tag_slugs(query: Select, tag_slugs: list[str]) -> Select:
        unique_slugs = list(dict.fromkeys(tag_slugs))
        subq = (
            select(PublicationTag.publication_id)
            .join(Tag, Tag.id == PublicationTag.tag_id)
            .where(Tag.slug.in_(unique_slugs))
            .group_by(PublicationTag.publication_id)
            .having(func.count(func.distinct(PublicationTag.tag_id)) == len(unique_slugs))
            .subquery()
        )
        return query.where(Publication.id.in_(select(subq.c.publication_id)))

    @staticmethod
    def _enrich_publication_with_comments_count(query: Select) -> Select:
        comments_count_subquery = (
            select(func.count(Comment.id))
            .where(Comment.publication_id == Publication.id)
            .where(Comment.deleted_at.is_(None))
            .scalar_subquery()
        )
        return query.options(with_expression(Publication.comments_count, comments_count_subquery))

    @staticmethod
    def _enrich_publication_with_likes_count(query: Select) -> Select:
        # core.database.select auto-filters soft-deleted only when called on a model class;
        # here we pass func.count(...), so deleted_at must be filtered explicitly.
        likes_count_subquery = (
            select(func.count(Like.id))
            .where(Like.publication_id == Publication.id)
            .where(Like.deleted_at.is_(None))
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
