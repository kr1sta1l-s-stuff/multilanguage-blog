"""added publication tags

Revision ID: c4e5d2a3b1f9
Revises: b3f4c1d92e8a
Create Date: 2026-05-19 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op


revision: str = 'c4e5d2a3b1f9'
down_revision: Union[str, None] = 'b3f4c1d92e8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('slug', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )
    op.create_index('ix_tags_slug', 'tags', ['slug'])

    op.create_table(
        'publication_tags',
        sa.Column('publication_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['publication_id'], ['publications.id']),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id']),
        sa.PrimaryKeyConstraint('publication_id', 'tag_id'),
    )
    op.create_index('ix_publication_tags_tag_id', 'publication_tags', ['tag_id'])


def downgrade() -> None:
    op.drop_index('ix_publication_tags_tag_id', table_name='publication_tags')
    op.drop_table('publication_tags')
    op.drop_index('ix_tags_slug', table_name='tags')
    op.drop_table('tags')
