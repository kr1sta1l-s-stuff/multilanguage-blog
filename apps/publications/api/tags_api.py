from fastapi import APIRouter, Depends, Query
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.ext.asyncio import AsyncSession

from apps.publications.schemas.responses import RelatedTagResponse, TagResponse
from apps.publications.services.tag import TagQueryService
from core.database import get_session
from core.dependencies import get_command_query_service


tags_router = APIRouter(tags=["tags"])


@tags_router.get(
    "/",
    response_model=Page[TagResponse],
)
async def list_tags(
    search: str | None = None,
    session: AsyncSession = Depends(get_session),
    query_service: TagQueryService = Depends(
        get_command_query_service(TagQueryService)
    ),
):
    if search:
        stmt = query_service.search(search)
    else:
        stmt = query_service.list_all()
    return await paginate(session, stmt)


@tags_router.get(
    "/related",
    response_model=list[RelatedTagResponse],
)
async def related_tags(
    tags: list[str] = Query(default=[]),
    limit: int = Query(default=20, ge=1, le=100),
    query_service: TagQueryService = Depends(
        get_command_query_service(TagQueryService)
    ),
):
    pairs = await query_service.related(tags, limit=limit)
    return [
        RelatedTagResponse(id=tag.id, name=tag.name, slug=tag.slug, count=count)
        for tag, count in pairs
    ]
