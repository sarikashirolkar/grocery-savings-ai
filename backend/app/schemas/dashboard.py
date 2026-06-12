from pydantic import BaseModel


class BudgetStatus(BaseModel):
    monthly_budget: float | None = None
    projected_spend: float = 0
    selected_spend: float = 0
    remaining_budget: float | None = None
    budget_utilization_pct: float | None = None
    over_budget: bool = False
    warning: str | None = None


class DashboardNotification(BaseModel):
    title: str
    message: str
    kind: str
    item_name: str | None = None
    store_name: str | None = None
    savings_amount: float | None = None


class PredictionAccuracySummary(BaseModel):
    prediction_month: str | None = None
    matched_items: int = 0
    predicted_items: int = 0
    actual_items: int = 0
    match_rate: float = 0
    spend_accuracy_pct: float = 0
    confidence_delta: float = 0


class SavingsLeaderboardEntry(BaseModel):
    month: str
    savings: float
    rank: int


class DashboardSummary(BaseModel):
    bills_uploaded: int
    monthly_grocery_spend: float
    optimized_grocery_spend: float
    monthly_savings: float
    lifetime_savings: float
    savings_percentage: float
    currency_code: str = "INR"
    currency_symbol: str = "₹"
    region: str = "india"
    budget_status: BudgetStatus
    notifications: list[DashboardNotification] = []
    prediction_accuracy: PredictionAccuracySummary | None = None


class NamedValue(BaseModel):
    name: str
    value: float


class SavingsTrendPoint(BaseModel):
    month: str
    actual_spend: float
    optimized_spend: float
    savings: float


class SavingsReport(BaseModel):
    leaderboard: list[SavingsLeaderboardEntry]
    monthly_savings: list[SavingsTrendPoint]
