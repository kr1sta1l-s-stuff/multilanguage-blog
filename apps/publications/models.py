import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, query_expression, relationship

from core.models import Base, SoftDeleteMixin, UUIDMixin


class PublicationTag(Base):
    __tablename__ = "publication_tags"
    __table_args__ = (
        Index("ix_publication_tags_tag_id", "tag_id"),
    )

    publication_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("publications.id"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tags.id"), primary_key=True
    )


class Tag(Base, UUIDMixin):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(64), nullable=False)
    slug: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


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
        back_populates="publication",
        primaryjoin=(
            "and_(Publication.id == PublicationImages.publication_id, "
            "PublicationImages.deleted_at.is_(None))"
        ),
        order_by="PublicationImages.position",
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

    tags: Mapped[list["Tag"]] = relationship(
        "Tag", secondary="publication_tags", lazy="raise"
    )


class PublicationImages(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "publication_images"

    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False)
    publication: Mapped["Publication"] = relationship(
        "Publication",
        back_populates="images"
    )
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(default=0, server_default="0", nullable=False)


class Comment(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "comments"

    __table_args__ = (
        CheckConstraint("LENGTH(content) <= 2048", name="check_content_length"),
    )

    content: Mapped[str] = mapped_column(String(2048), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False)
    thread_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id"), nullable=True
    )
    replied_at: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id"), nullable=True
    )

    author: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="comments"
    )
    publication: Mapped["Publication"] = relationship(
        "Publication",
        back_populates="comments"
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class Like(Base, UUIDMixin, SoftDeleteMixin):
    __tablename__ = "likes"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    publication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("publications.id"), nullable=False)

    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="likes"
    )
    publication: Mapped["Publication"] = relationship(
        "Publication",
        back_populates="likes"
    )
