from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.users.enums import UserRights
from core.models import Base, SoftDeleteMixin, UUIDMixin


class User(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    password: Mapped["Password"] = relationship(  # noqa: F821
        "Password",
        back_populates="user",
        uselist=False
    )
    rights: Mapped[UserRights] = mapped_column(
        BigInteger,
        nullable=False,
        default=UserRights.CAN_COMMENT.value
    )

    publications: Mapped[list["Publication"]] = relationship(  # noqa: F821
        "Publication",
        back_populates="author"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment",
        back_populates="author"
    )

    def has_right(self, right: UserRights) -> bool:
        return (self.rights & right.value) != 0
