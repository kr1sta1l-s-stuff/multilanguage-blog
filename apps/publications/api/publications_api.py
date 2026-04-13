import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.ext.asyncio import AsyncSession

from apps.publications.schemas.responses import PublicationListResponse, PublicationResponse
from apps.publications.services.publication import (
    PublicationCommandService,
    PublicationQueryService,
)
from apps.users.enums import UserRights
from apps.users.models.user import User
from core.config import settings
from core.database import get_session
from core.dependencies import get_command_query_service, get_current_user, get_current_user_optional
from core.schemas import ErrorResponse
from core.storage import S3Service, get_s3


publications_router = APIRouter(tags=["publications"])


@publications_router.get(
    "/",
    response_model=Page[PublicationListResponse],
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Validation error",
        },
    },
)
async def get_publications(
    session: AsyncSession = Depends(get_session),
    query_service: PublicationQueryService = Depends(
        get_command_query_service(PublicationQueryService)
    ),
    current_user: User | None = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None
    return await paginate(session, await query_service.get_all_published(user_id))


@publications_router.post(
    "/",
    response_model=PublicationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "You are not allowed to publish publications",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Validation error",
        },
    },
)
async def create_publication(
    title: str = Form(...),
    content: str = Form(...),
    images: list[UploadFile] = File(default=[]),
    publish_immediately: bool = Form(default=True),
    s3: S3Service = Depends(get_s3),
    current_user: User = Depends(get_current_user),
    command_service: PublicationCommandService = Depends(
        get_command_query_service(PublicationCommandService)
    ),
):
    if not current_user.has_right(UserRights.CAN_PUBLISH):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to publish publications",
        )
    if len(images) > settings.max_images_per_publication:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum {settings.max_images_per_publication} images allowed",
        )
    urls = await s3.upload_files(images)
    return await command_service.create(
        title,
        content,
        urls,
        current_user.id,
        publish_immediately,
    )


@publications_router.get(
    "/{publication_id}",
    response_model=PublicationResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Publication not found"},
    },
)
async def get_publication(
    publication_id: uuid.UUID,
    query_service: PublicationQueryService = Depends(
        get_command_query_service(PublicationQueryService)
    ),
    current_user: User | None = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None
    publication = await query_service.get_by_id(publication_id, user_id)
    if publication is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publication not found",
        )
    return publication


@publications_router.delete(
    "/{publication_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "You are not allowed to delete this publication",
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Publication not found",
        },
    },
)
async def delete_publication(
    publication_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    query_service: PublicationQueryService = Depends(
        get_command_query_service(PublicationQueryService)
    ),
    command_service: PublicationCommandService = Depends(
        get_command_query_service(PublicationCommandService)
    ),
):
    publication = await query_service.get_by_id(publication_id)
    if publication.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this publication",
        )

    try:
        await command_service.delete(publication_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
