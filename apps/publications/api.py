from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.ext.asyncio import AsyncSession

from apps.publications.schemas.responses import PublicationResponse
from apps.publications.services.post import PublicationCommandService, PublicationQueryService
from apps.users.enums import UserRights
from apps.users.models.user import User
from core.config import settings
from core.database import get_session
from core.dependencies import get_current_user
from core.schemas import ErrorResponse
from core.storage import S3Service, get_s3


router = APIRouter(prefix="/publications", tags=["publications"])


@router.get(
    "/",
    response_model=Page[PublicationResponse],
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def get_publications(
    session: AsyncSession = Depends(get_session),
):
    return await paginate(session, await PublicationQueryService(session).get_all())


@router.post(
    "/",
    response_model=PublicationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def create_publication(
    title: str = Form(...),
    content: str = Form(...),
    images: list[UploadFile] = File(default=[]),
    session: AsyncSession = Depends(get_session),
    s3: S3Service = Depends(get_s3),
    current_user: User = Depends(get_current_user),
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
    return await PublicationCommandService(session).create(title, content, urls, current_user.id)
