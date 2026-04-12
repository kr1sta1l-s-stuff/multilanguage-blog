import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from apps.users.schemas.responses import UserResponse


class PublicationImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    image_url: str


class PublicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    images: list[PublicationImageResponse]
    comments_count: int
    created_at: datetime
    published_at: datetime | None


class PublicationListResponse(PublicationResponse):
    @field_validator("content", mode="after")
    @classmethod
    def _truncate_content(cls, value: str) -> str:
        return value[:100]


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    author: UserResponse
    created_at: datetime
