"""added comment threads

Revision ID: b3f4c1d92e8a
Revises: a82681a4e71f
Create Date: 2026-05-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3f4c1d92e8a'
down_revision: Union[str, None] = 'a82681a4e71f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('comments', sa.Column('thread_id', sa.UUID(), nullable=True))
    op.add_column('comments', sa.Column('replied_at', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_comments_thread_id_comments', 'comments', 'comments',
        ['thread_id'], ['id'],
    )
    op.create_foreign_key(
        'fk_comments_replied_at_comments', 'comments', 'comments',
        ['replied_at'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_comments_replied_at_comments', 'comments', type_='foreignkey')
    op.drop_constraint('fk_comments_thread_id_comments', 'comments', type_='foreignkey')
    op.drop_column('comments', 'replied_at')
    op.drop_column('comments', 'thread_id')
