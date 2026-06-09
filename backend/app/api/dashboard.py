from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictedBasket
from app.models.pricing import SavingsRecommendation
from app.models.receipt import Receipt, ReceiptItem
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, NamedValue, SavingsTrendPoint
from app.services.analytics import compare_prices_for_basket

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bills_uploaded = db.query(Receipt).filter_by(user_id=current_user.id).count()
    current_month_receipts = db.query(Receipt).filter_by(user_id=current_user.id).all()
    monthly_spend = round(sum(receipt.total_amount for receipt in current_month_receipts), 2)
    recommendation = (
        db.query(SavingsRecommendation)
        .filter_by(user_id=current_user.id)
        .order_by(SavingsRecommendation.id.desc())
        .first()
    )
    optimized = recommendation.optimized_spend if recommendation else monthly_spend
    lifetime_savings = round(
        sum(rec.total_estimated_saving for rec in db.query(SavingsRecommendation).filter_by(user_id=current_user.id).all()),
        2,
    )
    monthly_savings = recommendation.total_estimated_saving if recommendation else 0
    savings_percentage = recommendation.savings_percentage if recommendation else 0
    return DashboardSummary(
        bills_uploaded=bills_uploaded,
        monthly_grocery_spend=monthly_spend,
        optimized_grocery_spend=optimized,
        monthly_savings=monthly_savings,
        lifetime_savings=lifetime_savings,
        savings_percentage=savings_percentage,
    )


@router.get("/monthly-savings", response_model=list[SavingsTrendPoint])
def monthly_savings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipts = db.query(Receipt).filter_by(user_id=current_user.id).all()
    grouped = defaultdict(lambda: {"actual": 0.0, "optimized": 0.0})
    for receipt in receipts:
        key = receipt.purchase_date.strftime("%Y-%m")
        grouped[key]["actual"] += receipt.total_amount
        grouped[key]["optimized"] += receipt.total_amount * 0.92
    points = []
    for month in sorted(grouped):
        actual = round(grouped[month]["actual"], 2)
        optimized = round(grouped[month]["optimized"], 2)
        points.append(SavingsTrendPoint(month=month, actual_spend=actual, optimized_spend=optimized, savings=round(actual - optimized, 2)))
    return points


@router.get("/category-spend", response_model=list[NamedValue])
def category_spend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = (
        db.query(ReceiptItem)
        .join(ReceiptItem.receipt)
        .filter_by(user_id=current_user.id)
        .all()
    )
    grouped = defaultdict(float)
    for item in items:
        grouped[item.category or "Other"] += item.total_price
    return [NamedValue(name=key, value=round(value, 2)) for key, value in sorted(grouped.items())]


@router.get("/store-comparison", response_model=list[NamedValue])
def store_comparison(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipts = db.query(Receipt).filter_by(user_id=current_user.id).all()
    grouped = defaultdict(float)
    for receipt in receipts:
        grouped[receipt.store_name] += receipt.total_amount
    return [NamedValue(name=key, value=round(value, 2)) for key, value in sorted(grouped.items())]


@router.get("/top-savings")
def top_savings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
    if not basket:
        return []
    comparisons = compare_prices_for_basket(db, basket)
    return sorted(comparisons, key=lambda item: item["estimated_saving"], reverse=True)[:10]
