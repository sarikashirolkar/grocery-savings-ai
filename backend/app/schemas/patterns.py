from datetime import date

from pydantic import BaseModel, ConfigDict


class PurchasePatternOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    normalized_item_name: str
    item_name: str
    average_purchase_quantity: float
    average_price_paid: float
    purchase_frequency_days: float
    preferred_store: str | None = None
    usual_monthly_quantity: float
    category: str | None = None
    category_spend: float
    predicted_next_purchase_date: date
    confidence_score: float
