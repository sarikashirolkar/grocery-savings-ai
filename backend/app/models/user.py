from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    household_size: Mapped[int] = mapped_column(Integer, default=1)
    city: Mapped[str] = mapped_column(String(120), default="Bengaluru")
    preferred_store: Mapped[str | None] = mapped_column(String(120), nullable=True)
    monthly_budget: Mapped[float | None] = mapped_column(Float, nullable=True)

    receipts = relationship("Receipt", back_populates="user", cascade="all, delete-orphan")
    patterns = relationship("UserPurchasePattern", back_populates="user", cascade="all, delete-orphan")
    predicted_baskets = relationship("PredictedBasket", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("SavingsRecommendation", back_populates="user", cascade="all, delete-orphan")
