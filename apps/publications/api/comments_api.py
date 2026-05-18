import uuid

from fastapi import APIRouter, Depends, Form, HTTPException, Response, status
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.ext.asyncio import AsyncSession

from apps.publications.api.dependencies import (
    get_comment,
    get_publication_or_404,
    get_reply_target,
)
from apps.publications.models import Comment, Publication
from apps.publications.schemas.responses import CommentResponse
from apps.publications.services.comment import CommentCommandService, CommentQueryService
from apps.users.enums import UserRights
from apps.users.models.user import User
from core.database import get_session
from core.dependencies import get_command_query_service, get_current_user
from core.schemas import ErrorResponse


publication_comments_router = APIRouter(tags=["comments"])
comments_router = APIRouter(tags=["comments"])


@publication_comments_router.get(
    "/{publication_id}/comments",
    response_model=Page[CommentResponse],
)
async def get_comments(
    publication_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    query_service: CommentQueryService = Depends(
        get_command_query_service(CommentQueryService)
    ),
) -> Page[CommentResponse]:
    return await paginate(session, await query_service.get_by_publication_id(publication_id))


@publication_comments_router.post(
    "/{publication_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "You are not allowed to comment on this publication",
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Publication or reply target not found",
        },
    },
)
async def create_comment(
    content: str = Form(..., min_length=1, max_length=2048),
    publication: Publication = Depends(get_publication_or_404),
    parent: Comment | None = Depends(get_reply_target),
    current_user: User = Depends(get_current_user),
    command_service: CommentCommandService = Depends(
        get_command_query_service(CommentCommandService)
    ),
) -> CommentResponse:
    if not current_user.has_right(UserRights.CAN_COMMENT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to comment on this publication",
        )
    return await command_service.create(publication, content, current_user.id, parent)


@comments_router.patch(
    "/{comment_id}",
    response_model=CommentResponse,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "You are not allowed to edit this comment",
        },
    },
)
async def update_comment(
    content: str = Form(..., min_length=1, max_length=2048),
    comment: Comment = Depends(get_comment),
    current_user: User = Depends(get_current_user),
    command_service: CommentCommandService = Depends(
        get_command_query_service(CommentCommandService)
    ),
) -> CommentResponse:
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to edit this comment",
        )
    return await command_service.update(comment, content)


@comments_router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "You are not allowed to delete this comment",
        },
    },
)
async def delete_comment(
    comment: Comment = Depends(get_comment),
    current_user: User = Depends(get_current_user),
    command_service: CommentCommandService = Depends(
        get_command_query_service(CommentCommandService)
    ),
) -> None:
    if (comment.author_id != current_user.id) and (
        not current_user.has_right(UserRights.CAN_MODERATE_COMMENTS)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this comment",
        )
    await command_service.delete(comment)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
