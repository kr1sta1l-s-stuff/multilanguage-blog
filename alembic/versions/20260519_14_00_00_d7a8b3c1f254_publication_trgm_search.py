"""publication trigram search

Revision ID: d7a8b3c1f254
Revises: c4e5d2a3b1f9
Create Date: 2026-05-19 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd7a8b3c1f254'
down_revision: Union[str, None] = 'c4e5d2a3b1f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX ix_publications_title_trgm ON publications "
        "USING gin (title gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX ix_publications_content_trgm ON publications "
        "USING gin (content gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_publications_content_trgm")
    op.execute("DROP INDEX IF EXISTS ix_publications_title_trgm")
