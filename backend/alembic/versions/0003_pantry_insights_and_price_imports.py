"""pantry insights and price imports

Revision ID: 0003_pantry_insights_and_price_imports
Revises: 0002_receipt_storage_and_prediction_history
Create Date: 2026-06-13
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_pantry_insights_and_price_imports"
down_revision = "0002_receipt_storage_and_prediction_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    store_price_columns = {column["name"] for column in inspector.get_columns("store_prices")}
    existing_tables = set(inspector.get_table_names())

    with op.batch_alter_table("users") as batch_op:
        if "dietary_preferences" not in user_columns:
            batch_op.add_column(sa.Column("dietary_preferences", sa.String(length=255), nullable=True))
        if "brand_preference_strength" not in user_columns:
            batch_op.add_column(sa.Column("brand_preference_strength", sa.Float(), nullable=False, server_default="0.45"))
        if "substitution_tolerance" not in user_columns:
            batch_op.add_column(sa.Column("substitution_tolerance", sa.String(length=32), nullable=False, server_default="balanced"))

    with op.batch_alter_table("store_prices") as batch_op:
        if "source" not in store_price_columns:
            batch_op.add_column(sa.Column("source", sa.String(length=120), nullable=True))
        if "captured_at" not in store_price_columns:
            batch_op.add_column(sa.Column("captured_at", sa.Date(), nullable=True))

    if "pantry_items" not in existing_tables:
        op.create_table(
            "pantry_items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
            sa.Column("item_name", sa.String(length=255), nullable=False),
            sa.Column("normalized_item_name", sa.String(length=255), nullable=False, index=True),
            sa.Column("category", sa.String(length=120), nullable=True),
            sa.Column("on_hand_quantity", sa.Float(), nullable=False, server_default="0"),
            sa.Column("monthly_usage_quantity", sa.Float(), nullable=False, server_default="0"),
            sa.Column("days_remaining", sa.Float(), nullable=False, server_default="0"),
            sa.Column("depletion_risk", sa.String(length=32), nullable=False, server_default="stable"),
            sa.Column("buy_timing", sa.String(length=32), nullable=False, server_default="later"),
            sa.Column("last_purchase_date", sa.Date(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("pantry_items")
    with op.batch_alter_table("store_prices") as batch_op:
        batch_op.drop_column("captured_at")
        batch_op.drop_column("source")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("substitution_tolerance")
        batch_op.drop_column("brand_preference_strength")
        batch_op.drop_column("dietary_preferences")
