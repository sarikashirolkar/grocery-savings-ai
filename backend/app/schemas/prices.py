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
    in_stock: bool
    stock_status: str
    source: str | None = None
    captured_at: date | None = None


class StoreOption(BaseModel):
    store_name: str
    regular_price: float
    offer_price: float
    discount_percentage: float
    offer_description: str | None = None
    in_stock: bool
    stock_status: str
    delivery_fee: float
    travel_cost: float
    convenience_index: float
    effective_total: float
    recommendation_score: float
    price_component: float = 0
    fee_component: float = 0
    convenience_credit: float = 0
    stock_penalty: float = 0
    why: str | None = None


class PriceComparisonItem(BaseModel):
    item_name: str
    normalized_item_name: str
    category: str | None = None
    average_price_paid: float
    predicted_quantity: float
    cheapest_store: str | None = None
    highest_discount_store: str | None = None
    best_offer: str | None = None
    regular_price: float | None = None
    offer_price: float | None = None
    estimated_saving: float = 0
    best_store: str | None = None
    second_best_store: str | None = None
    difference_to_second_best: float = 0
    substitution_item_name: str | None = None
    substitution_saving: float | None = None
    substitution_reason: str | None = None
    options: list[StoreOption] = []


class RecommendationExplanation(BaseModel):
    winning_store: str
    savings_vs_baseline: float
    price_impact: float
    fee_impact: float
    convenience_impact: float
    stock_risk_impact: float
    summary: str


class RecommendationItemReason(BaseModel):
    item_name: str
    recommended_store: str | None = None
    savings: float = 0
    reason: str


class PriceImportResult(BaseModel):
    imported_count: int
    source: str
    stores_touched: list[str] = []


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
    recommendation_strategy: str
    explanation: RecommendationExplanation | None = None
    item_reasons: list[RecommendationItemReason] = []
