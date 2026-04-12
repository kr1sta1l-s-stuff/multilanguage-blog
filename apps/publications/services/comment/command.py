import uuid
from datetime import datetime

from apps.publications.models import Comment
from core.base_service import AbstractBaseService
from core.database import select


class CommentCommandService(AbstractBaseService):
    async def create(
            self,
            publication_id: uuid.UUID,
            content: str,
            author_id: uuid.UUID,
    ) -> Comment:
        comment = Comment(publication_id=publication_id, content=content, author_id=author_id)
        self.session.add(comment)
        await self.session.commit()
        await self.session.refresh(comment, ["author"])
        return comment

    async def delete(self, comment_id: uuid.UUID) -> None:
        comment = (
            await self.session.execute(
                select(Comment)
                .where(Comment.id == comment_id)
            )
        ).scalar_one_or_none()
        if comment is None:
            raise ValueError("Comment not found")
        comment.deleted_at = datetime.now()
        await self.session.add(comment)
        await self.session.commit()
