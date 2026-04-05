from collections.abc import AsyncGenerator

from redis.asyncio import Redis

from core.config import settings


_redis: Redis | None = None


async def get_redis() -> AsyncGenerator[Redis, None]:
    yield _redis


async def init_redis() -> None:
    global _redis
    _redis = Redis.from_url(settings.redis_url, decode_responses=True)


async def close_redis() -> None:
    if _redis:
        await _redis.aclose()
