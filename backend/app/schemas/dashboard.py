from pydantic import BaseModel


class DashboardSummary(BaseModel):
    bills_uploaded: int
    monthly_grocery_spend: float
    optimized_grocery_spend: float
    monthly_savings: float
    lifetime_savings: float
    savings_percentage: float


class NamedValue(BaseModel):
    name: str
    value: float


class SavingsTrendPoint(BaseModel):
    month: str
    actual_spend: float
    optimized_spend: float
    savings: float
