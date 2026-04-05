import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models import Base, TimestampMixin, UUIDMixin


class Password(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "passwords"

    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="password")  # noqa: F821
