"""create events table

Revision ID: b387be6e16b9
Revises: 
Create Date: 2026-07-20 11:18:09.792116

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b387be6e16b9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "events",
        sa.Column("id", sa.INTEGER, primary_key=True),
        sa.Column("timestamp", sa.String, nullable=False),
        sa.Column("source_ip", sa.String, nullable=False),
        sa.Column("event_type", sa.String, nullable= False),
        sa.Column("username", sa.String)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("events")
