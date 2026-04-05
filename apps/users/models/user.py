from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models import Base, SoftDeleteMixin, UUIDMixin


class User(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    password: Mapped["Password"] = relationship(  # noqa: F821
        "Password",
        back_populates="user",
        uselist=False
    )
