import uuid

from fastapi import APIRouter, Depends, Form, HTTPException, Response, status
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.ext.asyncio import AsyncSession

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
    },
)
async def create_comment(
    publication_id: uuid.UUID,
    content: str = Form(..., min_length=1, max_length=2048),
    current_user: User = Depends(get_current_user),
    command_service: CommentCommandService = Depends(
        get_command_query_service(CommentCommandService)
    ),
) -> CommentResponse:
    if len(content) < 1 or len(content) > 2048:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment content must be between 1 and 2048 characters",
        )
    if not current_user.has_right(UserRights.CAN_COMMENT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to comment on this publication",
        )
    return await command_service.create(publication_id, content, current_user.id)


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
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    query_service: CommentQueryService = Depends(
        get_command_query_service(CommentQueryService)
    ),
    command_service: CommentCommandService = Depends(
        get_command_query_service(CommentCommandService)
    ),
) -> None:
    comment = await query_service.get_by_id(comment_id)
    if (
        (comment.author_id != current_user.id) or
        (not current_user.has_right(UserRights.CAN_MODERATE_COMMENTS))
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this comment",
        )
    await command_service.delete(comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
