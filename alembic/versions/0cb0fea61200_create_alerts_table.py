"""create alerts table

Revision ID: 0cb0fea61200
Revises: b387be6e16b9
Create Date: 2026-07-20 11:25:58.760821

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0cb0fea61200'
down_revision: Union[str, Sequence[str], None] = 'b387be6e16b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "alerts",
        sa.Column("id", sa.INTEGER, primary_key=True),
        sa.Column("rule_id", sa.INTEGER, nullable=False),
        sa.Column("timestamp", sa.String, nullable=False),
        sa.Column("source_ip", sa.String, nullable= False),
        sa.Column("description", sa.String, nullable=False),
        sa.Column("is_resolved", sa.INTEGER, nullable=False)
    )
    

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("alerts")
