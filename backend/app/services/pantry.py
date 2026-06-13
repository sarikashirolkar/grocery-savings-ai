from collections import defaultdict
from datetime import date

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.pantry import PantryItem
from app.models.pricing import UserPurchasePattern
from app.models.receipt import ReceiptItem


def sync_pantry(db: Session, user_id: int) -> list[PantryItem]:
    patterns = db.query(UserPurchasePattern).filter_by(user_id=user_id).all()
    receipt_items = (
        db.query(ReceiptItem)
        .join(ReceiptItem.receipt)
        .filter_by(user_id=user_id)
        .order_by(ReceiptItem.purchase_date.desc())
        .all()
    )
    latest_by_name: dict[str, ReceiptItem] = {}
    for item in receipt_items:
        latest_by_name.setdefault(item.normalized_item_name, item)

    db.execute(delete(PantryItem).where(PantryItem.user_id == user_id))
    pantry_items: list[PantryItem] = []
    today = date.today()

    for pattern in patterns:
        latest = latest_by_name.get(pattern.normalized_item_name)
        last_quantity = latest.quantity if latest else pattern.average_purchase_quantity
        last_purchase_date = latest.purchase_date if latest else pattern.predicted_next_purchase_date
        daily_usage = (pattern.usual_monthly_quantity or pattern.average_purchase_quantity or 0) / 30
        days_since_purchase = max((today - last_purchase_date).days, 0) if last_purchase_date else 0
        on_hand_quantity = max(last_quantity - (daily_usage * days_since_purchase), 0)
        days_remaining = round(on_hand_quantity / daily_usage, 1) if daily_usage > 0 else 999

        if days_remaining <= 5:
            depletion_risk = "high"
            buy_timing = "buy_now"
        elif days_remaining <= 12:
            depletion_risk = "medium"
            buy_timing = "buy_soon"
        else:
            depletion_risk = "low"
            buy_timing = "later"

        pantry_item = PantryItem(
            user_id=user_id,
            item_name=pattern.item_name,
            normalized_item_name=pattern.normalized_item_name,
            category=pattern.category,
            on_hand_quantity=round(on_hand_quantity, 2),
            monthly_usage_quantity=round(pattern.usual_monthly_quantity or pattern.average_purchase_quantity, 2),
            days_remaining=days_remaining,
            depletion_risk=depletion_risk,
            buy_timing=buy_timing,
            last_purchase_date=last_purchase_date,
        )
        db.add(pantry_item)
        pantry_items.append(pantry_item)

    db.commit()
    for item in pantry_items:
        db.refresh(item)
    return pantry_items


def pantry_lookup(db: Session, user_id: int) -> dict[str, PantryItem]:
    return {
        item.normalized_item_name: item
        for item in db.query(PantryItem).filter_by(user_id=user_id).all()
    }


def pantry_timing_counts(items: list[PantryItem]) -> dict[str, int]:
    counts = defaultdict(int)
    for item in items:
        counts[item.buy_timing] += 1
    return dict(counts)
