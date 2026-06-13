from pathlib import Path
import argparse

from alembic import command
from alembic.config import Config

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.services.runtime_migrations import apply_sqlite_compat_columns
from app.services.seed import seed_demo_data


def ensure_runtime_dirs() -> None:
    Path(settings.receipt_upload_dir).mkdir(parents=True, exist_ok=True)


def run_migrations() -> None:
    Base.metadata.create_all(bind=engine)
    apply_sqlite_compat_columns(engine)
    alembic_cfg = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(alembic_cfg, "head")


def seed_demo(region: str | None = None, force: bool = False) -> None:
    db = SessionLocal()
    try:
        seed_demo_data(db, region=region, force=force)
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Grocery Savings backend bootstrap utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("migrate", help="Run Alembic migrations and SQLite compatibility updates")

    seed_parser = subparsers.add_parser("seed-demo", help="Seed the demo workspace explicitly")
    seed_parser.add_argument("--region", default=None, help="Demo region to seed")
    seed_parser.add_argument("--force", action="store_true", help="Rebuild demo data even if it already matches")

    args = parser.parse_args()
    ensure_runtime_dirs()

    if args.command == "migrate":
        run_migrations()
        return

    if args.command == "seed-demo":
        run_migrations()
        seed_demo(region=args.region, force=args.force)


if __name__ == "__main__":
    main()
