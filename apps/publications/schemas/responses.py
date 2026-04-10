import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
