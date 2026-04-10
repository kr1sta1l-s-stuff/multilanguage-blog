import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from apps.publications.models import Publication, PublicationImages


class PublicationCommandService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
            self,
            title: str,
            content: str,
            images: list[str],
            author_id: uuid.UUID,
    ) -> Publication:
        publication = Publication(
            title=title,
            content=content,
            author_id=author_id,
            images=[PublicationImages(image_url=url) for url in images],
        )
        self.session.add(publication)
        await self.session.commit()
        await self.session.refresh(publication, ["images"])
        publication.comments_count = 0
        return publication
