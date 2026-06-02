import json
import uuid
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.ext.asyncio import AsyncSession

from apps.publications.api.dependencies import get_publication_or_404
from apps.publications.models import Publication
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
    tags: list[str] | None = Query(default=None),
    q: str | None = Query(default=None),
    sort: Literal["date", "likes", "relevance"] | None = Query(default=None),
    order: Literal["asc", "desc"] = Query(default="desc"),
    session: AsyncSession = Depends(get_session),
    query_service: PublicationQueryService = Depends(
        get_command_query_service(PublicationQueryService)
    ),
    current_user: User | None = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None
    has_search = bool((q or "").strip())
    effective_sort = sort or ("relevance" if has_search else "date")
    if effective_sort == "relevance" and not has_search:
        effective_sort = "date"
    return await paginate(
        session,
        await query_service.get_all_published(user_id, tags, q, effective_sort, order),
    )


@publications_router.get(
    "/drafts",
    response_model=Page[PublicationListResponse],
)
async def get_drafts(
    session: AsyncSession = Depends(get_session),
    query_service: PublicationQueryService = Depends(
        get_command_query_service(PublicationQueryService)
    ),
    current_user: User = Depends(get_current_user),
):
    return await paginate(session, await query_service.get_drafts(current_user.id))


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
    tags: list[str] = Form(default=[]),
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
        tags=tags,
    )


@publications_router.patch(
    "/{publication_id}",
    response_model=PublicationResponse,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "You are not allowed to update this publication",
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Publication not found",
        },
    },
)
async def update_publication(
    title: str | None = Form(default=None),
    content: str | None = Form(default=None),
    tags: list[str] | None = Form(default=None),
    publish: bool | None = Form(default=None),
    image_order: str | None = Form(default=None),
    new_images: list[UploadFile] = File(default=[]),
    publication: Publication = Depends(get_publication_or_404),
    current_user: User = Depends(get_current_user),
    s3: S3Service = Depends(get_s3),
    command_service: PublicationCommandService = Depends(
        get_command_query_service(PublicationCommandService)
    ),
):
    if publication.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this publication",
        )

    order_tokens: list[str] | None = None
    new_image_urls: list[str] | None = None
    if image_order is not None:
        order_tokens = _parse_image_order(image_order, publication, len(new_images))
        if len(order_tokens) > settings.max_images_per_publication:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Maximum {settings.max_images_per_publication} images allowed",
            )
        new_image_urls = await s3.upload_files(new_images)

    return await command_service.update(
        publication,
        title=title,
        content=content,
        tags=tags,
        unset_tags=tags is not None,
        publish=publish,
        image_order=order_tokens,
        new_image_urls=new_image_urls,
    )


def _parse_image_order(raw: str, publication: Publication, new_count: int) -> list[str]:
    try:
        tokens = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="image_order must be valid JSON",
        )
    if not isinstance(tokens, list) or not all(isinstance(t, str) for t in tokens):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="image_order must be a list of strings",
        )

    live_ids = {img.id for img in publication.images}
    seen_existing: set[uuid.UUID] = set()
    seen_new: set[int] = set()
    for token in tokens:
        kind, _, ref = token.partition(":")
        if kind == "existing":
            try:
                img_id = uuid.UUID(ref)
            except ValueError:
                raise _image_order_error(f"invalid image id {ref!r}")
            if img_id not in live_ids:
                raise _image_order_error(f"image {ref} does not belong to this publication")
            if img_id in seen_existing:
                raise _image_order_error(f"duplicate image {ref}")
            seen_existing.add(img_id)
        elif kind == "new":
            if not ref.isdigit():
                raise _image_order_error(f"invalid new image index {ref!r}")
            idx = int(ref)
            if idx >= new_count or idx in seen_new:
                raise _image_order_error(f"invalid new image index {idx}")
            seen_new.add(idx)
        else:
            raise _image_order_error(f"invalid token {token!r}")

    if len(seen_new) != new_count:
        raise _image_order_error("every uploaded image must appear in image_order")
    return tokens


def _image_order_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"image_order: {detail}",
    )


@publications_router.get(
    "/{publication_id}",
    response_model=PublicationResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Publication not found"},
    },
)
async def get_publication(
    publication: Publication = Depends(get_publication_or_404),
):
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
    publication: Publication = Depends(get_publication_or_404),
    current_user: User = Depends(get_current_user),
    command_service: PublicationCommandService = Depends(
        get_command_query_service(PublicationCommandService)
    ),
):
    if publication.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this publication",
        )
    await command_service.delete(publication)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
