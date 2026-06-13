from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    on_hand_quantity: Mapped[float] = mapped_column(Float, default=0)
    monthly_usage_quantity: Mapped[float] = mapped_column(Float, default=0)
    days_remaining: Mapped[float] = mapped_column(Float, default=0)
    depletion_risk: Mapped[str] = mapped_column(String(32), default="stable")
    buy_timing: Mapped[str] = mapped_column(String(32), default="later")
    last_purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="pantry_items")
