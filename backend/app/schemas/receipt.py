from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ReceiptItemBase(BaseModel):
    item_name: str
    normalized_item_name: str
    brand: str | None = None
    category: str | None = None
    quantity: float
    unit: str | None = None
    pack_size: str | None = None
    unit_price: float
    total_price: float
    discount: float = 0
    offer_applied: str | None = None
    store_name: str
    purchase_date: date


class ReceiptItemCreate(ReceiptItemBase):
    pass


class ReceiptItemUpdate(ReceiptItemBase):
    id: int | None = None


class ReceiptUpload(BaseModel):
    store_name: str
    purchase_date: date
    receipt_number: str | None = None
    upload_type: str = "manual"
    raw_text: str | None = None
    total_amount: float = 0
    items: list[ReceiptItemCreate] = []


class ReceiptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_name: str
    receipt_number: str | None = None
    purchase_date: date
    total_amount: float
    upload_type: str
    file_name: str | None = None
    file_path: str | None = None
    mime_type: str | None = None
    file_size_bytes: int | None = None
    extraction_method: str | None = None
    raw_text: str | None = None
    created_at: datetime
    items: list[ReceiptItemBase]
