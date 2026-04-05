from redis.asyncio import Redis


class AuthQueryService:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def get_user_id_by_refresh_token(self, refresh_token: str) -> str | None:
        return await self.redis.get(f"refresh:{refresh_token}")
