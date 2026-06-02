"""add publication image position

Revision ID: f1a2b3c4d5e6
Revises: e9c4a1b7d6f3
Create Date: 2026-05-25 13:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e9c4a1b7d6f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'publication_images',
        sa.Column('position', sa.Integer(), server_default='0', nullable=False),
    )
    # Backfill existing rows: order within each publication by id (uuid7 ~ insertion order).
    op.execute(
        """
        UPDATE publication_images AS pi
        SET position = ranked.rn - 1
        FROM (
            SELECT id,
                   row_number() OVER (PARTITION BY publication_id ORDER BY id) AS rn
            FROM publication_images
        ) AS ranked
        WHERE pi.id = ranked.id
        """
    )


def downgrade() -> None:
    op.drop_column('publication_images', 'position')
