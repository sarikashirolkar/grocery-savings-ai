from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, dashboard, demo, patterns, prediction, prices, receipts, recommendations, shopping
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.services.runtime_migrations import apply_sqlite_compat_columns
from app.services.seed import seed_demo_data


def _run_migrations() -> None:
    Base.metadata.create_all(bind=engine)
    apply_sqlite_compat_columns(engine)
    alembic_cfg = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_runtime()
    Path(settings.receipt_upload_dir).mkdir(parents=True, exist_ok=True)
    _run_migrations()
    db = SessionLocal()
    try:
        seed_demo_data(db)
        yield
    finally:
        db.close()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(demo.router)
app.include_router(receipts.router)
app.include_router(patterns.router)
app.include_router(prediction.router)
app.include_router(prices.router)
app.include_router(recommendations.router)
app.include_router(shopping.router)
app.include_router(dashboard.router)
