from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    store_name: Mapped[str] = mapped_column(String(120))
    receipt_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    purchase_date: Mapped[date] = mapped_column(Date)
    total_amount: Mapped[float] = mapped_column(Float, default=0)
    upload_type: Mapped[str] = mapped_column(String(50), default="manual")
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extraction_method: Mapped[str | None] = mapped_column(String(80), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="receipts")
    items = relationship("ReceiptItem", back_populates="receipt", cascade="all, delete-orphan")


class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id"), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True)
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pack_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0)
    total_price: Mapped[float] = mapped_column(Float, default=0)
    discount: Mapped[float] = mapped_column(Float, default=0)
    offer_applied: Mapped[str | None] = mapped_column(String(255), nullable=True)
    store_name: Mapped[str] = mapped_column(String(120))
    purchase_date: Mapped[date] = mapped_column(Date)

    receipt = relationship("Receipt", back_populates="items")
