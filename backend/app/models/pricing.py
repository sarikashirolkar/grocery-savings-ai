from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    store_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    delivery_fee: Mapped[float] = mapped_column(Float, default=0)
    travel_cost: Mapped[float] = mapped_column(Float, default=0)
    convenience_index: Mapped[float] = mapped_column(Float, default=0.5)


class StorePrice(Base):
    __tablename__ = "store_prices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    store_name: Mapped[str] = mapped_column(String(120), index=True)
    item_name: Mapped[str] = mapped_column(String(255), index=True)
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True)
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    pack_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    regular_price: Mapped[float] = mapped_column(Float, default=0)
    offer_price: Mapped[float] = mapped_column(Float, default=0)
    discount_percentage: Mapped[float] = mapped_column(Float, default=0)
    offer_description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    valid_from: Mapped[date] = mapped_column(Date)
    valid_to: Mapped[date] = mapped_column(Date)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    stock_status: Mapped[str] = mapped_column(String(50), default="in_stock")
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    captured_at: Mapped[date | None] = mapped_column(Date, nullable=True)


class UserPurchasePattern(Base):
    __tablename__ = "user_purchase_patterns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    average_purchase_quantity: Mapped[float] = mapped_column(Float, default=0)
    average_price_paid: Mapped[float] = mapped_column(Float, default=0)
    purchase_frequency_days: Mapped[float] = mapped_column(Float, default=30)
    preferred_store: Mapped[str | None] = mapped_column(String(120), nullable=True)
    usual_monthly_quantity: Mapped[float] = mapped_column(Float, default=0)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    category_spend: Mapped[float] = mapped_column(Float, default=0)
    predicted_next_purchase_date: Mapped[date] = mapped_column(Date)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.5)

    user = relationship("User", back_populates="patterns")


class SavingsRecommendation(Base):
    __tablename__ = "savings_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    prediction_month: Mapped[str] = mapped_column(String(20), index=True)
    best_single_store: Mapped[str] = mapped_column(String(120))
    best_single_store_cost: Mapped[float] = mapped_column(Float, default=0)
    best_multi_store_cost: Mapped[float] = mapped_column(Float, default=0)
    expected_spend: Mapped[float] = mapped_column(Float, default=0)
    optimized_spend: Mapped[float] = mapped_column(Float, default=0)
    total_estimated_saving: Mapped[float] = mapped_column(Float, default=0)
    savings_percentage: Mapped[float] = mapped_column(Float, default=0)
    convenience_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    recommendation_strategy: Mapped[str] = mapped_column(String(120), default="balanced")

    user = relationship("User", back_populates="recommendations")
