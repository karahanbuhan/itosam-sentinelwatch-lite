"""create rules table

Revision ID: 0d4b79ba8073
Revises: 0cb0fea61200
Create Date: 2026-07-20 11:28:41.061326

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d4b79ba8073'
down_revision: Union[str, Sequence[str], None] = '0cb0fea61200'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "rules",
        sa.Column("id", sa.INTEGER, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("event_type", sa.String, nullable=False),
        sa.Column("threshold_count", sa.Integer, nullable= False),
        sa.Column("severity", sa.String, nullable=False),
        sa.Column("is_active", sa.Integer, nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("rules")
