from datetime import date

from pydantic import BaseModel, ConfigDict


class PredictedBasketItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_name: str
    normalized_item_name: str
    predicted_quantity: float
    expected_purchase_date: date
    average_price_usually_paid: float
    confidence_score: float


class PredictedBasketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prediction_month: str
    expected_total_spend: float
    items: list[PredictedBasketItemOut]
