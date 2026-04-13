from fastapi import APIRouter

from apps.auth.api import router as auth_router
from apps.publications.api import (
    comments_router,
    publication_comments_router,
    publications_router,
    publication_likes_router,
)
from apps.users.api import router as users_router


router = APIRouter(prefix="/api/v1")

router.include_router(auth_router, prefix="/auth")
router.include_router(users_router, prefix="/users")
router.include_router(publications_router, prefix="/publications")
router.include_router(publication_comments_router, prefix="/publications")
router.include_router(comments_router, prefix="/comments")
router.include_router(publication_likes_router, prefix="/publications")
