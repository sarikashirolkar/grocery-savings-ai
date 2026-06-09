from datetime import date

from pydantic import BaseModel, ConfigDict


class StorePriceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_name: str
    item_name: str
    normalized_item_name: str
    brand: str | None = None
    pack_size: str | None = None
    regular_price: float
    offer_price: float
    discount_percentage: float
    offer_description: str | None = None
    valid_from: date
    valid_to: date


class PriceComparisonItem(BaseModel):
    item_name: str
    normalized_item_name: str
    average_price_paid: float
    cheapest_store: str | None = None
    highest_discount_store: str | None = None
    best_offer: str | None = None
    regular_price: float | None = None
    offer_price: float | None = None
    estimated_saving: float = 0


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prediction_month: str
    best_single_store: str
    best_single_store_cost: float
    best_multi_store_cost: float
    expected_spend: float
    optimized_spend: float
    total_estimated_saving: float
    savings_percentage: float
    convenience_note: str | None = None
