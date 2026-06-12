"""receipt storage and prediction history

Revision ID: 0002_receipt_storage_and_prediction_history
Revises: 0001_initial_schema
Create Date: 2026-06-12
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_receipt_storage_and_prediction_history"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    receipt_columns = {column["name"] for column in inspector.get_columns("receipts")}
    basket_columns = {column["name"] for column in inspector.get_columns("predicted_baskets")}
    with op.batch_alter_table("receipts") as batch_op:
        if "file_path" not in receipt_columns:
            batch_op.add_column(sa.Column("file_path", sa.String(length=512), nullable=True))
        if "mime_type" not in receipt_columns:
            batch_op.add_column(sa.Column("mime_type", sa.String(length=120), nullable=True))
        if "file_size_bytes" not in receipt_columns:
            batch_op.add_column(sa.Column("file_size_bytes", sa.Integer(), nullable=True))
        if "extraction_method" not in receipt_columns:
            batch_op.add_column(sa.Column("extraction_method", sa.String(length=80), nullable=True))
    with op.batch_alter_table("predicted_baskets") as batch_op:
        if "created_at" not in basket_columns:
            batch_op.add_column(sa.Column("created_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("predicted_baskets") as batch_op:
        batch_op.drop_column("created_at")
    with op.batch_alter_table("receipts") as batch_op:
        batch_op.drop_column("extraction_method")
        batch_op.drop_column("file_size_bytes")
        batch_op.drop_column("mime_type")
        batch_op.drop_column("file_path")
