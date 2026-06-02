"""add user language

Revision ID: e9c4a1b7d6f3
Revises: d7a8b3c1f254
Create Date: 2026-05-25 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op


revision: str = 'e9c4a1b7d6f3'
down_revision: Union[str, None] = 'd7a8b3c1f254'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'language',
            sa.String(length=8),
            nullable=False,
            server_default='ru',
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'language')
