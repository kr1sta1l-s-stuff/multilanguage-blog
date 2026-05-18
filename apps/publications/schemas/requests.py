from pydantic import BaseModel, ConfigDict, field_validator

from core.config import settings


class PublicationCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    content: str
    images: list[str]
    tags: list[str] = []

    @field_validator("images")
    @classmethod
    def validate_images(cls, v: list[str]) -> list[str]:
        if len(v) > settings.max_images_per_publication:
            raise ValueError(
                f"You can only upload up to {settings.max_images_per_publication} images"
            )
        return v


class PublicationUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str | None = None
    content: str | None = None
    tags: list[str] | None = None
    publish: bool | None = None
