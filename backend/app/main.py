from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, dashboard, demo, patterns, prediction, prices, receipts, recommendations, shopping
from app.bootstrap import ensure_runtime_dirs, run_migrations, seed_demo
from app.core.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_runtime()
    ensure_runtime_dirs()
    if settings.run_migrations_on_startup:
        run_migrations()
    if settings.seed_demo_on_startup:
        seed_demo()
    yield


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
