from collections import Counter, defaultdict
from datetime import date, timedelta
from statistics import mean

from sqlalchemy import delete
from sqlalchemy.orm import Session, selectinload

from app.models.pantry import PantryItem
from app.models.prediction import PredictedBasket, PredictedBasketItem
from app.models.pricing import SavingsRecommendation, Store, StorePrice, UserPurchasePattern
from app.models.receipt import ReceiptItem
from app.models.shopping import ShoppingList, ShoppingListItem, UserSelectedStoreItem
from app.models.user import User
from app.services.pantry import pantry_lookup
from app.services.parser import infer_category


CONVENIENCE_INDEX_WEIGHT = 12
PREFERENCE_BONUS_WEIGHT = 10
OUT_OF_STOCK_PENALTY = 1000
PRICE_ALERT_DISCOUNT_THRESHOLD = 15
SUBSTITUTION_MIN_SAVING = 10


def _dietary_preferences(user: User) -> set[str]:
    raw = user.dietary_preferences or ""
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def _pack_size_value(pack_size: str | None) -> float | None:
    if not pack_size:
        return None
    digits = "".join(character if (character.isdigit() or character == ".") else " " for character in pack_size)
    parts = [part for part in digits.split() if part]
    if not parts:
        return None
    try:
        return float(parts[0])
    except ValueError:
        return None


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
    patterns = db.query(UserPurchasePattern).filter_by(user_id=user_id).all()
    pantry_by_name = pantry_lookup(db, user_id)
    basket = (
        db.query(PredictedBasket)
        .options(selectinload(PredictedBasket.items))
        .filter_by(user_id=user_id, prediction_month=prediction_month)
        .first()
    )
    if basket is None:
        basket = PredictedBasket(user_id=user_id, prediction_month=prediction_month, expected_total_spend=0)
        db.add(basket)
        db.flush()
    else:
        basket.items.clear()
        db.flush()

    total_spend = 0.0
    for pattern in patterns:
        pantry_item = pantry_by_name.get(pattern.normalized_item_name)
        baseline_needed = pattern.usual_monthly_quantity or pattern.average_purchase_quantity
        on_hand = pantry_item.on_hand_quantity if pantry_item else 0
        if pantry_item and pantry_item.buy_timing == "later":
            predicted_quantity = max(round(baseline_needed * 0.25, 2), 0)
        else:
            predicted_quantity = max(round(baseline_needed - on_hand, 2), 0)
        if predicted_quantity <= 0:
            continue

        item = PredictedBasketItem(
            predicted_basket_id=basket.id,
            item_name=pattern.item_name,
            normalized_item_name=pattern.normalized_item_name,
            category=pattern.category,
            predicted_quantity=predicted_quantity,
            expected_purchase_date=pattern.predicted_next_purchase_date,
            average_price_usually_paid=pattern.average_price_paid,
            confidence_score=pattern.confidence_score,
        )
        total_spend += item.predicted_quantity * item.average_price_usually_paid
        db.add(item)

    basket.expected_total_spend = round(total_spend, 2)
    db.commit()
    db.refresh(basket)
    sync_shopping_list_from_prediction(db, user_id, basket)
    return basket


def _weighted_option_for_user(user: User, store: Store | None, price: StorePrice, quantity: float) -> dict:
    price_component = round(price.offer_price * quantity, 2)
    delivery_fee = store.delivery_fee if store else 0
    travel_cost = store.travel_cost if store else 0
    fee_component = round(delivery_fee + travel_cost, 2)
    convenience_index = store.convenience_index if store else 0.5
    convenience_credit = round(convenience_index * CONVENIENCE_INDEX_WEIGHT, 2)
    preference_bonus = 0.2 if user.preferred_store and user.preferred_store == price.store_name else 0
    stock_penalty = OUT_OF_STOCK_PENALTY if not price.in_stock else 0
    recommendation_score = round(
        price_component + fee_component + stock_penalty - convenience_credit - (preference_bonus * PREFERENCE_BONUS_WEIGHT),
        2,
    )
    reasons = [f"item total {price_component:.0f}", f"fees {fee_component:.0f}"]
    if convenience_credit:
        reasons.append(f"convenience credit {convenience_credit:.1f}")
    if stock_penalty:
        reasons.append("stock risk penalty applied")
    return {
        "store_name": price.store_name,
        "regular_price": price.regular_price,
        "offer_price": price.offer_price,
        "discount_percentage": price.discount_percentage,
        "offer_description": price.offer_description,
        "in_stock": price.in_stock,
        "stock_status": price.stock_status,
        "delivery_fee": delivery_fee,
        "travel_cost": travel_cost,
        "convenience_index": convenience_index,
        "effective_total": round(price_component + fee_component, 2),
        "recommendation_score": recommendation_score,
        "price_component": price_component,
        "fee_component": fee_component,
        "convenience_credit": convenience_credit,
        "stock_penalty": stock_penalty,
        "why": ", ".join(reasons),
    }


def _substitution_allowed(user: User, *, original_item_name: str, alternative_item_name: str, original_brand: str | None, alternative_brand: str | None) -> bool:
    dietary = _dietary_preferences(user)
    if "vegetarian" in dietary and "chicken" in alternative_item_name.lower():
        return False
    if "dairy_free" in dietary and any(token in alternative_item_name.lower() for token in {"milk", "curd", "paneer", "cheese", "yogurt"}):
        return False
    if original_brand and alternative_brand and original_brand != alternative_brand and user.brand_preference_strength >= 0.75:
        return False
    return True


def _find_substitution(
    db: Session,
    user: User,
    *,
    normalized_item_name: str,
    category: str | None,
    average_price_paid: float,
    item_name: str | None,
) -> tuple[str | None, float | None, str | None]:
    item_category = category or infer_category(normalized_item_name)
    original_prices = db.query(StorePrice).filter_by(normalized_item_name=normalized_item_name).all()
    original_brand = original_prices[0].brand if original_prices else None
    original_pack = _pack_size_value(original_prices[0].pack_size) if original_prices else None
    tolerance = {"strict": 0.15, "balanced": 0.35, "flexible": 0.6}.get(user.substitution_tolerance, 0.35)

    alternatives = []
    for price in db.query(StorePrice).all():
        if price.normalized_item_name == normalized_item_name:
            continue
        if infer_category(price.item_name) != item_category:
            continue
        if not _substitution_allowed(
            user,
            original_item_name=item_name or normalized_item_name,
            alternative_item_name=price.item_name,
            original_brand=original_brand,
            alternative_brand=price.brand,
        ):
            continue
        alt_pack = _pack_size_value(price.pack_size)
        if original_pack and alt_pack and abs(alt_pack - original_pack) / max(original_pack, 1) > tolerance:
            continue
        alternatives.append(price)

    if not alternatives:
        return None, None, None
    cheapest = min(alternatives, key=lambda price: price.offer_price)
    saving = round(average_price_paid - cheapest.offer_price, 2)
    minimum_saving = SUBSTITUTION_MIN_SAVING * (1 + user.brand_preference_strength)
    if saving < minimum_saving:
        return None, None, None
    reason = f"Same category alternative with better price at comparable pack size from {cheapest.store_name}."
    return cheapest.item_name, saving, reason


def compare_item_prices(
    db: Session,
    user: User,
    normalized_item_name: str,
    quantity: float,
    average_price_paid: float,
    category: str | None = None,
    item_name: str | None = None,
) -> dict:
    store_prices = db.query(StorePrice).filter_by(normalized_item_name=normalized_item_name).all()
    if not store_prices:
        substitution_item_name, substitution_saving, substitution_reason = _find_substitution(
            db,
            user,
            normalized_item_name=normalized_item_name,
            category=category,
            average_price_paid=average_price_paid,
            item_name=item_name,
        )
        return {
            "item_name": item_name or normalized_item_name.title(),
            "normalized_item_name": normalized_item_name,
            "category": category,
            "average_price_paid": average_price_paid,
            "predicted_quantity": quantity,
            "cheapest_store": None,
            "highest_discount_store": None,
            "best_offer": None,
            "regular_price": None,
            "offer_price": None,
            "estimated_saving": 0,
            "best_store": None,
            "second_best_store": None,
            "difference_to_second_best": 0,
            "substitution_item_name": substitution_item_name,
            "substitution_saving": substitution_saving,
            "substitution_reason": substitution_reason,
            "options": [],
        }

    stores = {store.store_name: store for store in db.query(Store).all()}
    options = [_weighted_option_for_user(user, stores.get(price.store_name), price, quantity) for price in store_prices]
    priced_options = sorted(options, key=lambda option: option["offer_price"])
    ranked_options = sorted(options, key=lambda option: option["recommendation_score"])
    cheapest = priced_options[0]
    highest_discount = max(options, key=lambda option: option["discount_percentage"])
    best_ranked = ranked_options[0]
    second_best = ranked_options[1] if len(ranked_options) > 1 else ranked_options[0]
    substitution_item_name, substitution_saving, substitution_reason = _find_substitution(
        db,
        user,
        normalized_item_name=normalized_item_name,
        category=category,
        average_price_paid=average_price_paid or cheapest["offer_price"],
        item_name=item_name or store_prices[0].item_name,
    )

    return {
        "item_name": item_name or store_prices[0].item_name,
        "normalized_item_name": normalized_item_name,
        "category": category,
        "average_price_paid": average_price_paid,
        "predicted_quantity": quantity,
        "cheapest_store": cheapest["store_name"],
        "highest_discount_store": highest_discount["store_name"],
        "best_offer": cheapest["offer_description"],
        "regular_price": cheapest["regular_price"],
        "offer_price": cheapest["offer_price"],
        "estimated_saving": round(max(average_price_paid - cheapest["offer_price"], 0), 2),
        "best_store": best_ranked["store_name"],
        "second_best_store": second_best["store_name"],
        "difference_to_second_best": round(second_best["effective_total"] - best_ranked["effective_total"], 2),
        "substitution_item_name": substitution_item_name,
        "substitution_saving": substitution_saving,
        "substitution_reason": substitution_reason,
        "options": ranked_options,
    }


def compare_prices_for_basket(db: Session, user: User, basket: PredictedBasket) -> list[dict]:
    return [
        compare_item_prices(
            db,
            user,
            item.normalized_item_name,
            item.predicted_quantity,
            item.average_price_usually_paid,
            category=item.category,
            item_name=item.item_name,
        )
        for item in basket.items
    ]


def recommendation_payload(db: Session, recommendation: SavingsRecommendation, basket: PredictedBasket | None) -> dict:
    comparisons = compare_prices_for_basket(db, recommendation.user, basket) if basket else []
    price_impact = 0.0
    fee_impact = 0.0
    convenience_impact = 0.0
    stock_risk_impact = 0.0
    item_reasons = []
    for comparison in comparisons:
        if not comparison["options"]:
            continue
        best = comparison["options"][0]
        price_impact += best["price_component"]
        fee_impact += best["fee_component"]
        convenience_impact += best["convenience_credit"]
        stock_risk_impact += best["stock_penalty"]
        item_reasons.append(
            {
                "item_name": comparison["item_name"],
                "recommended_store": best["store_name"],
                "savings": comparison["estimated_saving"],
                "reason": best["why"],
            }
        )
    explanation = {
        "winning_store": recommendation.best_single_store if recommendation.recommendation_strategy == "single_store" else "multi-store mix",
        "savings_vs_baseline": recommendation.total_estimated_saving,
        "price_impact": round(price_impact, 2),
        "fee_impact": round(fee_impact, 2),
        "convenience_impact": round(convenience_impact, 2),
        "stock_risk_impact": round(stock_risk_impact, 2),
        "summary": recommendation.convenience_note or "Recommendation balances price, fees, and convenience.",
    }
    payload = {
        "id": recommendation.id,
        "prediction_month": recommendation.prediction_month,
        "best_single_store": recommendation.best_single_store,
        "best_single_store_cost": recommendation.best_single_store_cost,
        "best_multi_store_cost": recommendation.best_multi_store_cost,
        "expected_spend": recommendation.expected_spend,
        "optimized_spend": recommendation.optimized_spend,
        "total_estimated_saving": recommendation.total_estimated_saving,
        "savings_percentage": recommendation.savings_percentage,
        "convenience_note": recommendation.convenience_note,
        "recommendation_strategy": recommendation.recommendation_strategy,
        "explanation": explanation,
        "item_reasons": sorted(item_reasons, key=lambda item: item["savings"], reverse=True)[:6],
    }
    return payload


def generate_recommendation(db: Session, user_id: int, basket: PredictedBasket) -> SavingsRecommendation:
    user = db.query(User).filter_by(id=user_id).first()
    comparisons = compare_prices_for_basket(db, user, basket)
    single_store_totals: dict[str, float] = defaultdict(float)
    multi_store_total = 0.0

    for comparison in comparisons:
        if not comparison["options"]:
            multi_store_total += comparison["average_price_paid"] * comparison["predicted_quantity"]
            continue
        best_option = comparison["options"][0]
        multi_store_total += best_option["effective_total"]
        for option in comparison["options"]:
            single_store_totals[option["store_name"]] += option["effective_total"]

    best_single_store = min(single_store_totals, key=single_store_totals.get) if single_store_totals else "N/A"
    best_single_store_cost = round(single_store_totals.get(best_single_store, basket.expected_total_spend), 2)
    best_multi_store_cost = round(multi_store_total, 2)
    expected_spend = basket.expected_total_spend
    optimized_spend = min(best_single_store_cost, best_multi_store_cost)
    strategy = "single_store" if best_single_store_cost <= best_multi_store_cost else "balanced_multi_store"
    total_estimated_saving = round(expected_spend - optimized_spend, 2)
    savings_percentage = round((total_estimated_saving / expected_spend) * 100, 2) if expected_spend else 0
    convenience_note = (
        "Single-store buying wins after price, travel, and delivery costs are blended."
        if strategy == "single_store"
        else "A mixed basket wins because item-level savings beat the extra convenience costs."
    )

    recommendation = (
        db.query(SavingsRecommendation)
        .filter_by(user_id=user_id, prediction_month=basket.prediction_month)
        .first()
    )
    if recommendation is None:
        recommendation = SavingsRecommendation(user_id=user_id, prediction_month=basket.prediction_month)
        db.add(recommendation)
    recommendation.best_single_store = best_single_store
    recommendation.best_single_store_cost = best_single_store_cost
    recommendation.best_multi_store_cost = best_multi_store_cost
    recommendation.expected_spend = expected_spend
    recommendation.optimized_spend = optimized_spend
    recommendation.total_estimated_saving = total_estimated_saving
    recommendation.savings_percentage = savings_percentage
    recommendation.convenience_note = convenience_note
    recommendation.recommendation_strategy = strategy
    db.commit()
    db.refresh(recommendation)
    return recommendation


def sync_shopping_list_from_prediction(db: Session, user_id: int, basket: PredictedBasket) -> ShoppingList:
    shopping_list = (
        db.query(ShoppingList)
        .options(selectinload(ShoppingList.items).selectinload(ShoppingListItem.selected_store_items))
        .filter_by(user_id=user_id, status="active")
        .order_by(ShoppingList.id.desc())
        .first()
    )
    if shopping_list is None:
        shopping_list = ShoppingList(
            user_id=user_id,
            prediction_month=basket.prediction_month,
            title="Recommended Shopping Plan",
            status="active",
        )
        db.add(shopping_list)
        db.flush()
    else:
        shopping_list.prediction_month = basket.prediction_month
        shopping_list.items.clear()
        db.flush()

    expected_total = 0.0
    for basket_item in basket.items:
        expected_total += basket_item.predicted_quantity * basket_item.average_price_usually_paid
        db.add(
            ShoppingListItem(
                shopping_list_id=shopping_list.id,
                item_name=basket_item.item_name,
                normalized_item_name=basket_item.normalized_item_name,
                category=basket_item.category,
                predicted_quantity=basket_item.predicted_quantity,
                average_price_usually_paid=basket_item.average_price_usually_paid,
                is_recommended=True,
                source="prediction",
            )
        )
    shopping_list.expected_total_spend = round(expected_total, 2)
    shopping_list.optimized_total_spend = 0
    db.commit()
    db.refresh(shopping_list)
    return shopping_list


def calculate_selected_total(shopping_list: ShoppingList) -> tuple[float, list[str], int]:
    total = 0.0
    stores_used: set[str] = set()
    selected_items_count = 0
    for item in shopping_list.items:
        if not item.selected_store_items:
            continue
        latest = sorted(item.selected_store_items, key=lambda selection: selection.selected_at)[-1]
        total += latest.selected_price * latest.quantity
        stores_used.add(latest.store_name)
        selected_items_count += 1
    return round(total, 2), sorted(stores_used), selected_items_count


def build_budget_status(user: User, *, projected_spend: float, selected_spend: float = 0) -> dict:
    budget = user.monthly_budget
    if budget is None or budget <= 0:
        return {
            "monthly_budget": None,
            "projected_spend": round(projected_spend, 2),
            "selected_spend": round(selected_spend, 2),
            "remaining_budget": None,
            "budget_utilization_pct": None,
            "over_budget": False,
            "warning": None,
        }
    remaining = round(budget - projected_spend, 2)
    utilization = round((projected_spend / budget) * 100, 2) if budget else None
    warning = None
    if projected_spend > budget:
        warning = "Predicted basket exceeds your monthly budget."
    elif utilization and utilization >= 85:
        warning = "Predicted basket is close to your monthly budget."
    return {
        "monthly_budget": round(budget, 2),
        "projected_spend": round(projected_spend, 2),
        "selected_spend": round(selected_spend, 2),
        "remaining_budget": remaining,
        "budget_utilization_pct": utilization,
        "over_budget": projected_spend > budget,
        "warning": warning,
    }


def build_price_notifications(comparisons: list[dict], preferred_store: str | None = None) -> list[dict]:
    notifications: list[dict] = []
    for comparison in comparisons:
        if not comparison["options"]:
            continue
        best_option = comparison["options"][0]
        if best_option["discount_percentage"] >= PRICE_ALERT_DISCOUNT_THRESHOLD:
            notifications.append(
                {
                    "title": f"{comparison['item_name']} is on sale",
                    "message": f"{comparison['item_name']} is {best_option['discount_percentage']:.0f}% off at {best_option['store_name']} this cycle.",
                    "kind": "price_drop",
                    "item_name": comparison["item_name"],
                    "store_name": best_option["store_name"],
                    "savings_amount": round(comparison["estimated_saving"], 2),
                }
            )
        if preferred_store:
            preferred_option = next((option for option in comparison["options"] if option["store_name"] == preferred_store and option["in_stock"]), None)
            if preferred_option:
                notifications.append(
                    {
                        "title": f"{comparison['item_name']} available at your preferred store",
                        "message": f"{comparison['item_name']} is currently in stock at {preferred_store}.",
                        "kind": "availability",
                        "item_name": comparison["item_name"],
                        "store_name": preferred_store,
                        "savings_amount": None,
                    }
                )
    return notifications[:8]


def historical_action_insights(db: Session, user: User, comparisons: list[dict], pantry_items: list[PantryItem]) -> list[dict]:
    insights: list[dict] = []
    category_prices: dict[str, list[float]] = defaultdict(list)
    category_baselines: dict[str, list[float]] = defaultdict(list)
    for comparison in comparisons:
        if comparison["category"] and comparison["offer_price"] is not None:
            category_prices[comparison["category"]].append(comparison["offer_price"])
            category_baselines[comparison["category"]].append(comparison["average_price_paid"])
    category_gaps = []
    for category, prices in category_prices.items():
        baseline = mean(category_baselines[category]) if category_baselines[category] else 0
        current = mean(prices) if prices else 0
        category_gaps.append((category, baseline - current))
    if category_gaps:
        biggest = max(category_gaps, key=lambda item: item[1])
        if biggest[1] > 5:
            insights.append({
                "title": f"You consistently overpay on {biggest[0].lower()}",
                "message": f"Current market pricing is about ₹{biggest[1]:.0f} below your usual paid price in this category.",
                "kind": "overpay_category",
                "severity": "medium",
            })

    if comparisons:
        urgent_best = Counter(
            comparison["options"][0]["store_name"]
            for comparison in comparisons
            if comparison["options"] and comparison["options"][0]["convenience_index"] >= 0.85
        )
        cheapest_best = Counter(
            comparison["cheapest_store"]
            for comparison in comparisons
            if comparison["cheapest_store"]
        )
        if urgent_best:
            store = urgent_best.most_common(1)[0][0]
            insights.append({
                "title": f"{store} is strongest for urgent fills",
                "message": f"It wins most often when convenience weighting matters, even after delivery and travel costs.",
                "kind": "urgency_store",
                "severity": "info",
            })
        if cheapest_best:
            store = cheapest_best.most_common(1)[0][0]
            insights.append({
                "title": f"{store} is strongest for bulk savings",
                "message": "It appears most often as the outright cheapest store across the current basket.",
                "kind": "bulk_store",
                "severity": "info",
            })

    produce_patterns = db.query(UserPurchasePattern).filter(
        UserPurchasePattern.user_id == user.id,
        UserPurchasePattern.category.in_(["Vegetables", "Fruits"])
    ).all()
    if produce_patterns:
        confidences = [pattern.confidence_score for pattern in produce_patterns]
        if mean(confidences) < 0.75:
            insights.append({
                "title": "Produce demand is more variable than staples",
                "message": "Your fruit and vegetable patterns are less stable, so prediction drift is more likely there.",
                "kind": "prediction_drift",
                "severity": "medium",
            })

    urgent_pantry = [item for item in pantry_items if item.buy_timing == "buy_now"]
    if urgent_pantry:
        names = ", ".join(item.item_name for item in urgent_pantry[:3])
        insights.append({
            "title": "Pantry depletion is driving near-term demand",
            "message": f"Buy soon: {names}. These items have the shortest days remaining based on recent usage.",
            "kind": "pantry_depletion",
            "severity": "high",
        })

    return insights[:6]


def prediction_accuracy_for_latest_completed_month(db: Session, user_id: int) -> dict | None:
    current_month = current_prediction_month()
    basket = (
        db.query(PredictedBasket)
        .options(selectinload(PredictedBasket.items))
        .filter(PredictedBasket.user_id == user_id, PredictedBasket.prediction_month < current_month)
        .order_by(PredictedBasket.prediction_month.desc())
        .first()
    )
    if basket is None:
        return None
    month_items = (
        db.query(ReceiptItem)
        .join(ReceiptItem.receipt)
        .filter_by(user_id=user_id)
        .all()
    )
    actual_by_name: dict[str, float] = defaultdict(float)
    actual_spend = 0.0
    for item in month_items:
        if item.purchase_date.strftime("%Y-%m") != basket.prediction_month:
            continue
        actual_by_name[item.normalized_item_name] += item.quantity
        actual_spend += item.total_price
    if not actual_by_name:
        return None
    predicted_by_name = {item.normalized_item_name: item.predicted_quantity for item in basket.items}
    matched = len(set(predicted_by_name) & set(actual_by_name))
    matched_confidences = [item.confidence_score for item in basket.items if item.normalized_item_name in actual_by_name]
    predicted_spend = basket.expected_total_spend
    spend_accuracy = 0.0
    if predicted_spend > 0:
        spend_accuracy = max(0.0, round(100 - (abs(predicted_spend - actual_spend) / predicted_spend) * 100, 2))
    average_confidence = (sum(matched_confidences) / len(matched_confidences)) * 100 if matched_confidences else 0
    predicted_count = len(predicted_by_name)
    actual_count = len(actual_by_name)
    match_rate = round((matched / max(predicted_count, actual_count)) * 100, 2) if max(predicted_count, actual_count) else 0
    return {
        "prediction_month": basket.prediction_month,
        "matched_items": matched,
        "predicted_items": predicted_count,
        "actual_items": actual_count,
        "match_rate": match_rate,
        "spend_accuracy_pct": spend_accuracy,
        "confidence_delta": round(match_rate - average_confidence, 2),
    }


def choose_store_for_item(db: Session, user: User, shopping_list_item: ShoppingListItem, store_name: str) -> UserSelectedStoreItem:
    comparison = compare_item_prices(
        db,
        user,
        shopping_list_item.normalized_item_name,
        shopping_list_item.predicted_quantity,
        shopping_list_item.average_price_usually_paid,
        category=shopping_list_item.category,
        item_name=shopping_list_item.item_name,
    )
    option = next((option for option in comparison["options"] if option["store_name"] == store_name), None)
    if option is None:
        raise ValueError("Store option not available for item")

    db.add(
        UserSelectedStoreItem(
            user_id=user.id,
            shopping_list_item_id=shopping_list_item.id,
            store_name=store_name,
            selected_price=option["offer_price"],
            quantity=shopping_list_item.predicted_quantity,
        )
    )
    db.commit()
    db.refresh(shopping_list_item)
    return sorted(shopping_list_item.selected_store_items, key=lambda selection: selection.selected_at)[-1]


def current_prediction_month() -> str:
    today = date.today()
    return f"{today.year}-{today.month:02d}"
