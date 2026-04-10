import re

from pydantic import BaseModel, field_validator


USERNAME_REGEX = re.compile(r"^[a-z0-9][a-z0-9_]{2,30}[a-z0-9]$")


class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not USERNAME_REGEX.match(v):
            raise ValueError(
                "Username must be 4-32 characters, contain only lowercase letters, "
                "digits, and underscores, and cannot start or end with an underscore"
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str
