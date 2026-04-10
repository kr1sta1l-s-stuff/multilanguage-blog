import asyncio
from pathlib import Path
from typing import AsyncGenerator

import aioboto3
import uuid_utils
from botocore.config import Config
from fastapi import UploadFile

from core.config import settings


_session = aioboto3.Session()


class S3Service:
    def __init__(self, client):
        self.client = client

    async def upload_file(self, file: UploadFile) -> str:
        suffix = Path(file.filename).suffix if file.filename else ""
        key = f"{uuid_utils.uuid7()}{suffix}"
        content = await file.read()
        await self.client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=content,
            ContentType=file.content_type or "application/octet-stream",
        )
        return f"{settings.s3_public_url}/{key}"

    async def upload_files(self, files: list[UploadFile]) -> list[str]:
        return list(await asyncio.gather(*[self.upload_file(f) for f in files]))


async def get_s3() -> AsyncGenerator[S3Service, None]:
    async with _session.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
    ) as client:
        yield S3Service(client)
