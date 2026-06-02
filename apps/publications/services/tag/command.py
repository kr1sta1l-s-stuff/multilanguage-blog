import re

from fastapi import HTTPException, status
from sqlalchemy import select as _sa_select
from sqlalchemy.exc import IntegrityError

from apps.publications.models import Tag
from apps.publications.services.tag.utils import slugify
from core.base_service import AbstractBaseService


_SLUG_RE = re.compile(r"^[^\W_]+(?:-[^\W_]+)*$", flags=re.UNICODE)
_MAX_TAGS_PER_PUBLICATION = 10
_MIN_SLUG_LEN = 2
_MAX_SLUG_LEN = 32


class TagCommandService(AbstractBaseService):
    async def normalize_and_get_or_create(self, names: list[str]) -> list[Tag]:
        if not names:
            return []

        slug_to_name: dict[str, str] = {}
        for raw in names:
            slug = slugify(raw)
            if not (_MIN_SLUG_LEN <= len(slug) <= _MAX_SLUG_LEN) or not _SLUG_RE.match(slug):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid tag: {raw!r}",
                )
            if slug not in slug_to_name:
                slug_to_name[slug] = raw.strip()

        if len(slug_to_name) > _MAX_TAGS_PER_PUBLICATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"At most {_MAX_TAGS_PER_PUBLICATION} tags per publication",
            )

        slugs = list(slug_to_name.keys())
        existing = await self._select_by_slugs(slugs)
        existing_by_slug = {tag.slug: tag for tag in existing}

        missing = [s for s in slugs if s not in existing_by_slug]
        for slug in missing:
            tag = Tag(name=slug_to_name[slug], slug=slug)
            self.session.add(tag)

        if missing:
            try:
                await self.session.flush()
            except IntegrityError:
                await self.session.rollback()
                existing = await self._select_by_slugs(slugs)
                existing_by_slug = {tag.slug: tag for tag in existing}
                still_missing = [s for s in slugs if s not in existing_by_slug]
                for slug in still_missing:
                    tag = Tag(name=slug_to_name[slug], slug=slug)
                    self.session.add(tag)
                await self.session.flush()
                existing = await self._select_by_slugs(slugs)
                existing_by_slug = {tag.slug: tag for tag in existing}
            else:
                existing = await self._select_by_slugs(slugs)
                existing_by_slug = {tag.slug: tag for tag in existing}

        return [existing_by_slug[slug] for slug in slugs]

    async def _select_by_slugs(self, slugs: list[str]) -> list[Tag]:
        if not slugs:
            return []
        result = await self.session.execute(
            _sa_select(Tag).where(Tag.slug.in_(slugs))
        )
        return list(result.scalars().all())
