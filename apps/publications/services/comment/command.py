import uuid
from datetime import datetime

from fastapi import HTTPException, status

from apps.publications.models import Comment, Publication
from core.base_service import AbstractBaseService


class CommentCommandService(AbstractBaseService):
    async def create(
            self,
            publication: Publication,
            content: str,
            author_id: uuid.UUID,
            parent: Comment | None = None,
    ) -> Comment:
        thread_id: uuid.UUID | None = None
        if parent is not None:
            if parent.publication_id != publication.id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reply target comment not found",
                )
            thread_id = parent.thread_id or parent.id
        comment = Comment(
            publication_id=publication.id,
            content=content,
            author_id=author_id,
            thread_id=thread_id,
            replied_at=parent.id if parent else None,
        )
        self.session.add(comment)
        await self.session.commit()
        await self.session.refresh(comment, ["author"])
        return comment

    async def update(self, comment: Comment, content: str) -> Comment:
        comment.content = content
        await self.session.commit()
        await self.session.refresh(comment, ["updated_at"])
        return comment

    async def delete(self, comment: Comment) -> None:
        comment.deleted_at = datetime.now()
        await self.session.commit()
