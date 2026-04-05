from fastapi import APIRouter

from apps.auth.router import router as auth_router
from apps.users.router import router as users_router


router = APIRouter(prefix="/api/v1")

router.include_router(auth_router, prefix="/auth")
router.include_router(users_router, prefix="/users")
