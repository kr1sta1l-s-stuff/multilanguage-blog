import uuid
from datetime import datetime

from apps.publications.models import Publication, PublicationImages
from apps.publications.services.tag import TagCommandService
from core.base_service import AbstractBaseService


class PublicationCommandService(AbstractBaseService):
    async def create(
            self,
            title: str,
            content: str,
            images: list[str],
            author_id: uuid.UUID,
            publish_immediately: bool = True,
            tags: list[str] | None = None,
    ) -> Publication:
        tag_objs = await TagCommandService(self.session).normalize_and_get_or_create(tags or [])
        publication = Publication(
            title=title,
            content=content,
            author_id=author_id,
            images=[PublicationImages(image_url=url) for url in images],
            published_at=datetime.now() if publish_immediately else None,
            tags=tag_objs,
        )
        self.session.add(publication)
        await self.session.commit()
        await self.session.refresh(publication, ["images", "tags"])
        publication.comments_count = 0
        publication.likes_count = 0
        publication.is_liked = False
        return publication

    async def update(
        self,
        publication: Publication,
        title: str | None = None,
        content: str | None = None,
        tags: list[str] | None = None,
        unset_tags: bool = False,
        publish: bool | None = None,
    ) -> Publication:
        if title is not None:
            publication.title = title
        if content is not None:
            publication.content = content
        if unset_tags:
            tag_objs = await TagCommandService(self.session).normalize_and_get_or_create(tags or [])
            publication.tags = tag_objs
        if publish is True and publication.published_at is None:
            publication.published_at = datetime.now()
        elif publish is False:
            publication.published_at = None
        await self.session.commit()
        await self.session.refresh(publication, ["images", "tags"])
        publication.comments_count = getattr(publication, "comments_count", 0) or 0
        publication.likes_count = getattr(publication, "likes_count", 0) or 0
        publication.is_liked = getattr(publication, "is_liked", False) or False
        return publication

    async def delete(self, publication: Publication) -> None:
        publication.deleted_at = datetime.now()
        await self.session.commit()
