from collections import defaultdict
import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictedBasket
from app.models.pricing import SavingsRecommendation
from app.models.receipt import Receipt, ReceiptItem
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, NamedValue, SavingsReport, SavingsTrendPoint
from app.services.analytics import (
    build_budget_status,
    build_price_notifications,
    compare_prices_for_basket,
    prediction_accuracy_for_latest_completed_month,
)
from app.services.regions import region_metadata
from app.services.seed import get_active_demo_region

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
    region = get_active_demo_region(db)
    region_info = region_metadata(region)
    basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
    comparisons = compare_prices_for_basket(db, current_user, basket) if basket else []
    return DashboardSummary(
        bills_uploaded=bills_uploaded,
        monthly_grocery_spend=monthly_spend,
        optimized_grocery_spend=optimized,
        monthly_savings=monthly_savings,
        lifetime_savings=lifetime_savings,
        savings_percentage=savings_percentage,
        currency_code=region_info["currency_code"],
        currency_symbol=region_info["currency_symbol"],
        region=region,
        budget_status=build_budget_status(current_user, projected_spend=basket.expected_total_spend if basket else monthly_spend),
        notifications=build_price_notifications(comparisons, current_user.preferred_store),
        prediction_accuracy=prediction_accuracy_for_latest_completed_month(db, current_user.id),
    )


@router.get("/monthly-savings", response_model=list[SavingsTrendPoint])
def monthly_savings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipts = db.query(Receipt).filter_by(user_id=current_user.id).all()
    recommendations = {
        rec.prediction_month: rec for rec in db.query(SavingsRecommendation).filter_by(user_id=current_user.id).all()
    }
    grouped = defaultdict(lambda: {"actual": 0.0})
    for receipt in receipts:
        key = receipt.purchase_date.strftime("%Y-%m")
        grouped[key]["actual"] += receipt.total_amount
    points = []
    for month in sorted(grouped):
        actual = round(grouped[month]["actual"], 2)
        recommendation = recommendations.get(month)
        optimized = round(recommendation.optimized_spend if recommendation is not None else actual * 0.92, 2)
        points.append(SavingsTrendPoint(month=month, actual_spend=actual, optimized_spend=optimized, savings=round(actual - optimized, 2)))
    return points


@router.get("/report", response_model=SavingsReport)
def savings_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    points = monthly_savings(db, current_user)
    leaderboard = [
        {"month": point.month, "savings": point.savings, "rank": rank}
        for rank, point in enumerate(sorted(points, key=lambda entry: entry.savings, reverse=True), start=1)
    ]
    return SavingsReport(leaderboard=leaderboard, monthly_savings=points)


@router.get("/report.csv")
def savings_report_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = savings_report(db, current_user)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["month", "actual_spend", "optimized_spend", "savings"])
    for point in report.monthly_savings:
        writer.writerow([point.month, point.actual_spend, point.optimized_spend, point.savings])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="monthly-savings-report.csv"'},
    )


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
    comparisons = compare_prices_for_basket(db, current_user, basket)
    return sorted(comparisons, key=lambda item: item["estimated_saving"], reverse=True)[:10]
