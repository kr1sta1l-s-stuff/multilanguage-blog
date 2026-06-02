from pydantic import BaseModel, Field


class UpdateUserRequest(BaseModel):
    language: str = Field(pattern=r"^[a-z]{2}(-[A-Z]{2})?$")
