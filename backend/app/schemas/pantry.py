from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class PantryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_name: str
    normalized_item_name: str
    category: str | None = None
    on_hand_quantity: float
    monthly_usage_quantity: float
    days_remaining: float
    depletion_risk: str
    buy_timing: str
    last_purchase_date: date | None = None
    updated_at: datetime


class PantrySyncOut(BaseModel):
    synced_count: int
    items: list[PantryItemOut]
