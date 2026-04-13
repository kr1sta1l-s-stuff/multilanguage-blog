import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, query_expression, relationship

from core.models import Base, SoftDeleteMixin, UUIDMixin


class Publication(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "publications"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=None, nullable=True
    )

    author: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="publications"
    )
    images: Mapped[list["PublicationImages"]] = relationship(
        "PublicationImages",
        back_populates="publication"
    )
    comments: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="publication"
    )
    comments_count: Mapped[int] = query_expression()

    likes: Mapped[list["Like"]] = relationship(
        "Like",
        back_populates="publication"
    )
    likes_count: Mapped[int] = query_expression()
    is_liked: Mapped[bool] = query_expression()


class PublicationImages(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "publication_images"

    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False)
    publication: Mapped["Publication"] = relationship(
        "Publication",
        back_populates="images"
    )
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)


class Comment(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "comments"

    __table_args__ = (
        CheckConstraint("LENGTH(content) <= 2048", name="check_content_length"),
    )

    content: Mapped[str] = mapped_column(String(2048), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False)

    author: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="comments"
    )
    publication: Mapped["Publication"] = relationship(
        "Publication",
        back_populates="comments"
    )


class Like(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "likes"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="likes"
    )
    publication: Mapped["Publication"] = relationship(
        "Publication",
        back_populates="likes"
    )