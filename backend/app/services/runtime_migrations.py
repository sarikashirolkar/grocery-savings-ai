from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def apply_sqlite_compat_columns(engine: Engine) -> None:
    """Backfill a few additive columns for legacy local SQLite DBs.

    Alembic is now the primary migration path. This helper only keeps already-
    existing developer SQLite files from breaking before they are recreated or
    upgraded in a real environment.
    """
    if engine.dialect.name != "sqlite":
        return
    inspector = inspect(engine)
    if "receipts" in inspector.get_table_names():
        receipt_columns = {column["name"] for column in inspector.get_columns("receipts")}
        additions = {
            "file_path": "ALTER TABLE receipts ADD COLUMN file_path VARCHAR(512)",
            "mime_type": "ALTER TABLE receipts ADD COLUMN mime_type VARCHAR(120)",
            "file_size_bytes": "ALTER TABLE receipts ADD COLUMN file_size_bytes INTEGER",
            "extraction_method": "ALTER TABLE receipts ADD COLUMN extraction_method VARCHAR(80)",
        }
        with engine.begin() as connection:
            for name, statement in additions.items():
                if name not in receipt_columns:
                    connection.execute(text(statement))
    if "predicted_baskets" in inspector.get_table_names():
        basket_columns = {column["name"] for column in inspector.get_columns("predicted_baskets")}
        if "created_at" not in basket_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE predicted_baskets ADD COLUMN created_at DATETIME"))
    if "users" in inspector.get_table_names():
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        additions = {
            "dietary_preferences": "ALTER TABLE users ADD COLUMN dietary_preferences VARCHAR(255)",
            "brand_preference_strength": "ALTER TABLE users ADD COLUMN brand_preference_strength FLOAT DEFAULT 0.45",
            "substitution_tolerance": "ALTER TABLE users ADD COLUMN substitution_tolerance VARCHAR(32) DEFAULT 'balanced'",
        }
        with engine.begin() as connection:
            for name, statement in additions.items():
                if name not in user_columns:
                    connection.execute(text(statement))
    if "store_prices" in inspector.get_table_names():
        store_price_columns = {column["name"] for column in inspector.get_columns("store_prices")}
        additions = {
            "source": "ALTER TABLE store_prices ADD COLUMN source VARCHAR(120)",
            "captured_at": "ALTER TABLE store_prices ADD COLUMN captured_at DATE",
        }
        with engine.begin() as connection:
            for name, statement in additions.items():
                if name not in store_price_columns:
                    connection.execute(text(statement))
