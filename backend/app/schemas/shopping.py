from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.dashboard import BudgetStatus, DashboardNotification
from app.schemas.prices import PriceComparisonItem


class ShoppingListItemCreate(BaseModel):
    item_name: str
    normalized_item_name: str
    category: str | None = None
    predicted_quantity: float = 1
    average_price_usually_paid: float = 0


class ShoppingListSelectionCreate(BaseModel):
    shopping_list_item_id: int
    store_name: str


class BulkStoreSelection(BaseModel):
    store_name: str


class StoreSelectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_name: str
    selected_price: float
    quantity: float
    selected_at: datetime


class ShoppingListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_name: str
    normalized_item_name: str
    category: str | None = None
    predicted_quantity: float
    average_price_usually_paid: float
    is_recommended: bool
    source: str
    selected_store_items: list[StoreSelectionOut]


class ShoppingListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prediction_month: str
    title: str
    status: str
    expected_total_spend: float
    optimized_total_spend: float
    created_at: datetime
    updated_at: datetime
    items: list[ShoppingListItemOut]


class BuyPlanSummary(BaseModel):
    shopping_list: ShoppingListOut
    comparisons: list[PriceComparisonItem]
    selected_total_spend: float
    selected_items_count: int
    stores_used: list[str]
    budget_status: BudgetStatus
    notifications: list[DashboardNotification] = []
