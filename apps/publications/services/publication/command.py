import uuid
from datetime import datetime

from apps.publications.models import Publication, PublicationImages
from core.base_service import AbstractBaseService


class PublicationCommandService(AbstractBaseService):
    async def create(
            self,
            title: str,
            content: str,
            images: list[str],
            author_id: uuid.UUID,
            publish_immediately: bool = True,
    ) -> Publication:
        publication = Publication(
            title=title,
            content=content,
            author_id=author_id,
            images=[PublicationImages(image_url=url) for url in images],
            published_at=datetime.now() if publish_immediately else None,
        )
        self.session.add(publication)
        await self.session.commit()
        await self.session.refresh(publication, ["images"])
        publication.comments_count = 0
        publication.likes_count = 0
        publication.is_liked = False
        return publication

    async def delete(self, publication: Publication) -> None:
        publication.deleted_at = datetime.now()
        await self.session.commit()
