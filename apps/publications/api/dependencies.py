import uuid

from fastapi import Depends, Form, HTTPException, status

from apps.publications.models import Comment, Publication
from apps.publications.services.comment import CommentQueryService
from apps.publications.services.publication import PublicationQueryService
from apps.users.models.user import User
from core.dependencies import get_command_query_service, get_current_user_optional


async def get_publication_or_404(
    publication_id: uuid.UUID,
    query_service: PublicationQueryService = Depends(
        get_command_query_service(PublicationQueryService)
    ),
    current_user: User | None = Depends(get_current_user_optional),
) -> Publication:
    user_id = current_user.id if current_user else None
    publication = await query_service.get_by_id(publication_id, user_id)
    if publication is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publication not found",
        )
    return publication


async def get_comment(
    comment_id: uuid.UUID,
    query_service: CommentQueryService = Depends(
        get_command_query_service(CommentQueryService)
    ),
) -> Comment:
    comment = await query_service.get_by_id(comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return comment


async def get_reply_target(
    replied_at: uuid.UUID | None = Form(None),
    query_service: CommentQueryService = Depends(
        get_command_query_service(CommentQueryService)
    ),
) -> Comment | None:
    if replied_at is None:
        return None
    parent = await query_service.get_by_id(replied_at)
    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply target comment not found",
        )
    return parent
