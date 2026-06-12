from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    prediction_month: Mapped[str] = mapped_column(String(20), index=True)
    title: Mapped[str] = mapped_column(String(255), default="Recommended Shopping Plan")
    status: Mapped[str] = mapped_column(String(50), default="active")
    expected_total_spend: Mapped[float] = mapped_column(Float, default=0)
    optimized_total_spend: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="shopping_lists")
    items = relationship("ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan")


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    shopping_list_id: Mapped[int] = mapped_column(ForeignKey("shopping_lists.id"), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    predicted_quantity: Mapped[float] = mapped_column(Float, default=1)
    average_price_usually_paid: Mapped[float] = mapped_column(Float, default=0)
    is_recommended: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str] = mapped_column(String(50), default="prediction")

    shopping_list = relationship("ShoppingList", back_populates="items")
    selected_store_items = relationship(
        "UserSelectedStoreItem",
        back_populates="shopping_list_item",
        cascade="all, delete-orphan",
    )


class UserSelectedStoreItem(Base):
    __tablename__ = "user_selected_store_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    shopping_list_item_id: Mapped[int] = mapped_column(ForeignKey("shopping_list_items.id"), index=True)
    store_name: Mapped[str] = mapped_column(String(120))
    selected_price: Mapped[float] = mapped_column(Float, default=0)
    quantity: Mapped[float] = mapped_column(Float, default=1)
    selected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    shopping_list_item = relationship("ShoppingListItem", back_populates="selected_store_items")
    user = relationship("User", back_populates="selected_store_items")
