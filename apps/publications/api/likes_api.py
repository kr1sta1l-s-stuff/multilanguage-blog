from fastapi import APIRouter, Depends, Response, status

from apps.publications.api.dependencies import get_publication_or_404
from apps.publications.models import Publication
from apps.publications.services.like import LikeCommandService
from apps.users.models.user import User
from core.dependencies import get_command_query_service, get_current_user
from core.schemas import ErrorResponse


publication_likes_router = APIRouter(tags=["likes"])


@publication_likes_router.post(
    "/{publication_id}/like",
    response_model=None,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Publication not found"},
    },
)
async def create_like(
    publication: Publication = Depends(get_publication_or_404),
    command_service: LikeCommandService = Depends(
        get_command_query_service(LikeCommandService)
    ),
    current_user: User = Depends(get_current_user),
) -> None:
    return await command_service.create(publication, current_user.id)


@publication_likes_router.delete(
    "/{publication_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Publication not found"},
    },
)
async def delete_like(
    publication: Publication = Depends(get_publication_or_404),
    current_user: User = Depends(get_current_user),
    command_service: LikeCommandService = Depends(
        get_command_query_service(LikeCommandService)
    ),
) -> None:
    await command_service.delete(publication, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
