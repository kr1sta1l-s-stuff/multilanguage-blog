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
            images=[
                PublicationImages(image_url=url, position=idx)
                for idx, url in enumerate(images)
            ],
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
        image_order: list[str] | None = None,
        new_image_urls: list[str] | None = None,
    ) -> Publication:
        if title is not None:
            publication.title = title
        if content is not None:
            publication.content = content
        if unset_tags:
            tag_objs = await TagCommandService(self.session).normalize_and_get_or_create(tags or [])
            publication.tags = tag_objs
        if image_order is not None:
            self._apply_image_order(publication, image_order, new_image_urls or [])
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

    def _apply_image_order(
        self,
        publication: Publication,
        image_order: list[str],
        new_image_urls: list[str],
    ) -> None:
        existing_by_id = {img.id: img for img in publication.images}
        keep_ids: set[uuid.UUID] = set()
        for position, token in enumerate(image_order):
            kind, _, ref = token.partition(":")
            if kind == "existing":
                img_id = uuid.UUID(ref)
                img = existing_by_id[img_id]
                img.position = position
                keep_ids.add(img_id)
            elif kind == "new":
                self.session.add(
                    PublicationImages(
                        publication_id=publication.id,
                        image_url=new_image_urls[int(ref)],
                        position=position,
                    )
                )
            else:
                raise ValueError(f"Invalid image order token: {token!r}")
        now = datetime.now()
        for img in publication.images:
            if img.id not in keep_ids:
                img.deleted_at = now

    async def delete(self, publication: Publication) -> None:
        publication.deleted_at = datetime.now()
        await self.session.commit()
