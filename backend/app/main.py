from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, patterns, prediction, prices, receipts, recommendations
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.services.seed import seed_demo_data

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(receipts.router)
app.include_router(patterns.router)
app.include_router(prediction.router)
app.include_router(prices.router)
app.include_router(recommendations.router)
app.include_router(dashboard.router)
