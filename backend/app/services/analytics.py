from collections import Counter, defaultdict
from datetime import date, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.prediction import PredictedBasket, PredictedBasketItem
from app.models.pricing import SavingsRecommendation, StorePrice, UserPurchasePattern
from app.models.receipt import ReceiptItem


def analyze_patterns(db: Session, user_id: int) -> list[UserPurchasePattern]:
    items = (
        db.query(ReceiptItem)
        .join(ReceiptItem.receipt)
        .filter_by(user_id=user_id)
        .order_by(ReceiptItem.purchase_date.asc())
        .all()
    )
    db.execute(delete(UserPurchasePattern).where(UserPurchasePattern.user_id == user_id))
    grouped: dict[str, list[ReceiptItem]] = defaultdict(list)
    for item in items:
        grouped[item.normalized_item_name].append(item)

    created_patterns: list[UserPurchasePattern] = []
    for normalized_name, group in grouped.items():
        prices = [item.unit_price for item in group]
        quantities = [item.quantity for item in group]
        dates = sorted(item.purchase_date for item in group)
        gaps = [(dates[index] - dates[index - 1]).days for index in range(1, len(dates))]
        frequency_days = sum(gaps) / len(gaps) if gaps else 30
        avg_quantity = sum(quantities) / len(quantities)
        avg_price = sum(prices) / len(prices)
        preferred_store = Counter(item.store_name for item in group).most_common(1)[0][0]
        latest_date = dates[-1]
        category = group[-1].category
        category_spend = sum(item.total_price for item in group if item.category == category)
        confidence_score = min(0.98, 0.55 + min(len(group), 6) * 0.07)

        pattern = UserPurchasePattern(
            user_id=user_id,
            normalized_item_name=normalized_name,
            item_name=group[-1].item_name,
            average_purchase_quantity=round(avg_quantity, 2),
            average_price_paid=round(avg_price, 2),
            purchase_frequency_days=round(frequency_days, 2),
            preferred_store=preferred_store,
            usual_monthly_quantity=round(avg_quantity * max(1, 30 / max(frequency_days, 1)), 2),
            category=category,
            category_spend=round(category_spend, 2),
            predicted_next_purchase_date=latest_date + timedelta(days=max(1, round(frequency_days))),
            confidence_score=round(confidence_score, 2),
        )
        db.add(pattern)
        created_patterns.append(pattern)

    db.commit()
    for pattern in created_patterns:
        db.refresh(pattern)
    return created_patterns


def generate_prediction(db: Session, user_id: int, prediction_month: str) -> PredictedBasket:
    db.execute(delete(PredictedBasketItem).where(PredictedBasketItem.predicted_basket_id.in_(
        db.query(PredictedBasket.id).filter(PredictedBasket.user_id == user_id)
    )))
    db.execute(delete(PredictedBasket).where(PredictedBasket.user_id == user_id))
    db.commit()

    patterns = db.query(UserPurchasePattern).filter_by(user_id=user_id).all()
    basket = PredictedBasket(user_id=user_id, prediction_month=prediction_month, expected_total_spend=0)
    db.add(basket)
    db.flush()

    total_spend = 0.0
    for pattern in patterns:
        item = PredictedBasketItem(
            predicted_basket_id=basket.id,
            item_name=pattern.item_name,
            normalized_item_name=pattern.normalized_item_name,
            predicted_quantity=pattern.usual_monthly_quantity or pattern.average_purchase_quantity,
            expected_purchase_date=pattern.predicted_next_purchase_date,
            average_price_usually_paid=pattern.average_price_paid,
            confidence_score=pattern.confidence_score,
        )
        total_spend += item.predicted_quantity * item.average_price_usually_paid
        db.add(item)

    basket.expected_total_spend = round(total_spend, 2)
    db.commit()
    db.refresh(basket)
    return basket


def compare_prices_for_basket(db: Session, basket: PredictedBasket) -> list[dict]:
    comparisons = []
    for item in basket.items:
        store_prices = db.query(StorePrice).filter_by(normalized_item_name=item.normalized_item_name).all()
        if not store_prices:
            comparisons.append(
                {
                    "item_name": item.item_name,
                    "normalized_item_name": item.normalized_item_name,
                    "average_price_paid": item.average_price_usually_paid,
                    "cheapest_store": None,
                    "highest_discount_store": None,
                    "best_offer": None,
                    "regular_price": None,
                    "offer_price": None,
                    "estimated_saving": 0,
                }
            )
            continue

        cheapest = min(store_prices, key=lambda price: price.offer_price)
        highest_discount = max(store_prices, key=lambda price: price.discount_percentage)
        comparisons.append(
            {
                "item_name": item.item_name,
                "normalized_item_name": item.normalized_item_name,
                "average_price_paid": item.average_price_usually_paid,
                "cheapest_store": cheapest.store_name,
                "highest_discount_store": highest_discount.store_name,
                "best_offer": cheapest.offer_description,
                "regular_price": cheapest.regular_price,
                "offer_price": cheapest.offer_price,
                "estimated_saving": round(item.average_price_usually_paid - cheapest.offer_price, 2),
            }
        )
    return comparisons


def generate_recommendation(db: Session, user_id: int, basket: PredictedBasket) -> SavingsRecommendation:
    db.execute(delete(SavingsRecommendation).where(SavingsRecommendation.user_id == user_id))
    comparisons = compare_prices_for_basket(db, basket)
    single_store_totals: dict[str, float] = defaultdict(float)
    multi_store_total = 0.0

    for item in basket.items:
        matched_prices = db.query(StorePrice).filter_by(normalized_item_name=item.normalized_item_name).all()
        if not matched_prices:
            multi_store_total += item.average_price_usually_paid * item.predicted_quantity
            continue
        best_price = min(matched_prices, key=lambda price: price.offer_price)
        multi_store_total += best_price.offer_price * item.predicted_quantity
        for store_price in matched_prices:
            single_store_totals[store_price.store_name] += store_price.offer_price * item.predicted_quantity

    best_single_store = min(single_store_totals, key=single_store_totals.get) if single_store_totals else "N/A"
    best_single_store_cost = round(single_store_totals.get(best_single_store, basket.expected_total_spend), 2)
    best_multi_store_cost = round(multi_store_total, 2)
    expected_spend = basket.expected_total_spend
    optimized_spend = min(best_single_store_cost, best_multi_store_cost)
    total_estimated_saving = round(expected_spend - optimized_spend, 2)
    savings_percentage = round((total_estimated_saving / expected_spend) * 100, 2) if expected_spend else 0
    convenience_note = (
        "Multi-store savings are small, so a single-store basket may be more convenient."
        if best_single_store_cost - best_multi_store_cost < 100
        else "Multi-store shopping unlocks meaningful savings this cycle."
    )

    recommendation = SavingsRecommendation(
        user_id=user_id,
        prediction_month=basket.prediction_month,
        best_single_store=best_single_store,
        best_single_store_cost=best_single_store_cost,
        best_multi_store_cost=best_multi_store_cost,
        expected_spend=expected_spend,
        optimized_spend=optimized_spend,
        total_estimated_saving=total_estimated_saving,
        savings_percentage=savings_percentage,
        convenience_note=convenience_note,
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return recommendation


def current_prediction_month() -> str:
    today = date.today()
    return f"{today.year}-{today.month:02d}"
