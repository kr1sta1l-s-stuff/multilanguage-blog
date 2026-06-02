from .comments_api import comments_router, publication_comments_router
from .likes_api import publication_likes_router
from .publications_api import publications_router
from .tags_api import tags_router


__all__ = [
    "comments_router",
    "publication_comments_router",
    "publications_router",
    "publication_likes_router",
    "tags_router",
]
