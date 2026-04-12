from uuid import UUID

from fastapi import Depends, HTTPException

from apps.choyses.models import Choys, ChoysWishlist
from apps.choyses.services.choys import ChoysService
from apps.choyses.services.choys_db.query import ChoysQueryService
from apps.common.dependencies import get_command_query_service
from apps.errors_detail import ChoysNotFound, ChoysWishlistNotFound


async def get_response_choys(
        choys_id: UUID,
        choys_service: ChoysService = Depends(get_command_query_service(ChoysService))
) -> Choys:
    choys = await choys_service.get_by_id(choys_id=choys_id)

    if choys is None:
        raise HTTPException(status_code=404, detail=ChoysNotFound().json())

    return choys


async def get_response_choys_wishlist(
        choys_id: UUID,
        wishlist_id: UUID,
        choys_query: ChoysQueryService = Depends(get_command_query_service(ChoysQueryService))
) -> ChoysWishlist:
    choys_wishlist = await choys_query.get_choys_wishlist(
        choys_id=choys_id,
        wishlist_id=wishlist_id,
    )

    if choys_wishlist is None:
        raise HTTPException(status_code=404, detail=ChoysWishlistNotFound().json())

    return choys_wishlist
