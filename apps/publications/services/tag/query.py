from sqlalchemy import func
from sqlalchemy.sql import Select

from apps.publications.models import PublicationTag, Tag
from core.base_service import AbstractBaseService
from core.database import select


class TagQueryService(AbstractBaseService):
    def list_all(self) -> Select:
        return select(Tag).order_by(Tag.slug.asc())

    def search(self, query: str) -> Select:
        pattern = f"{query.lower()}%"
        return (
            select(Tag)
            .where(Tag.slug.ilike(pattern))
            .order_by(Tag.slug.asc())
        )

    async def related(self, slugs: list[str], limit: int = 20) -> list[tuple[Tag, int]]:
        unique = list(dict.fromkeys(slugs))
        if not unique:
            return []
        matching_pubs = (
            select(PublicationTag.publication_id)
            .join(Tag, Tag.id == PublicationTag.tag_id)
            .where(Tag.slug.in_(unique))
            .group_by(PublicationTag.publication_id)
            .having(func.count(func.distinct(PublicationTag.tag_id)) == len(unique))
            .subquery()
        )
        count_col = func.count(PublicationTag.publication_id).label("cnt")
        stmt = (
            select(Tag, count_col)
            .join(PublicationTag, PublicationTag.tag_id == Tag.id)
            .where(PublicationTag.publication_id.in_(select(matching_pubs.c.publication_id)))
            .where(Tag.slug.notin_(unique))
            .group_by(Tag.id)
            .order_by(count_col.desc(), Tag.slug.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]
