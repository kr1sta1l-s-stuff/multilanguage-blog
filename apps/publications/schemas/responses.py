import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from apps.users.schemas.responses import UserResponse


class PublicationImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    image_url: str


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str


class RelatedTagResponse(TagResponse):
    count: int


class PublicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    author_id: uuid.UUID
    images: list[PublicationImageResponse]
    tags: list[TagResponse] = []
    comments_count: int
    likes_count: int
    created_at: datetime
    published_at: datetime | None
    is_liked: bool


class PublicationListResponse(PublicationResponse):
    @field_validator("content", mode="after")
    @classmethod
    def _truncate_content(cls, value: str) -> str:
        return value[:500]


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    author: UserResponse
    created_at: datetime
    updated_at: datetime
    thread_id: uuid.UUID | None
    replied_at: uuid.UUID | None
    is_deleted: bool = False

    @model_validator(mode="after")
    def _scrub_deleted(self) -> "CommentResponse":
        if self.is_deleted:
            self.content = ""
        return self
