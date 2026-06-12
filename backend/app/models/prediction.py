from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PredictedBasket(Base):
    __tablename__ = "predicted_baskets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    prediction_month: Mapped[str] = mapped_column(String(20), index=True)
    expected_total_spend: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predicted_baskets")
    items = relationship("PredictedBasketItem", back_populates="basket", cascade="all, delete-orphan")


class PredictedBasketItem(Base):
    __tablename__ = "predicted_basket_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    predicted_basket_id: Mapped[int] = mapped_column(ForeignKey("predicted_baskets.id"), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    predicted_quantity: Mapped[float] = mapped_column(Float, default=1)
    expected_purchase_date: Mapped[date] = mapped_column(Date)
    average_price_usually_paid: Mapped[float] = mapped_column(Float, default=0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.5)

    basket = relationship("PredictedBasket", back_populates="items")
