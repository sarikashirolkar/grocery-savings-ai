import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictedBasket
from app.models.shopping import ShoppingList, ShoppingListItem
from app.models.user import User
from app.schemas.shopping import (
    BulkStoreSelection,
    BuyPlanSummary,
    ShoppingListItemCreate,
    ShoppingListOut,
    ShoppingListSelectionCreate,
)
from app.services.analytics import (
    build_budget_status,
    build_price_notifications,
    calculate_selected_total,
    choose_store_for_item,
    compare_item_prices,
    current_prediction_month,
    generate_prediction,
    sync_shopping_list_from_prediction,
)

router = APIRouter(prefix="/shopping", tags=["shopping"])


def _current_list(db: Session, user_id: int) -> ShoppingList | None:
    return (
        db.query(ShoppingList)
        .options(selectinload(ShoppingList.items).selectinload(ShoppingListItem.selected_store_items))
        .filter_by(user_id=user_id, status="active")
        .order_by(ShoppingList.id.desc())
        .first()
    )


@router.post("/sync", response_model=ShoppingListOut)
def sync_from_prediction(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
    if not basket:
        basket = generate_prediction(db, current_user.id, current_prediction_month())
    return sync_shopping_list_from_prediction(db, current_user.id, basket)


@router.get("/current", response_model=ShoppingListOut)
def current(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not generated yet")
    return shopping_list


@router.get("/plan", response_model=BuyPlanSummary)
def current_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not generated yet")
    comparisons = [
        compare_item_prices(
            db,
            current_user,
            item.normalized_item_name,
            item.predicted_quantity,
            item.average_price_usually_paid,
            category=item.category,
            item_name=item.item_name,
        )
        for item in shopping_list.items
    ]
    total, stores_used, count = calculate_selected_total(shopping_list)
    shopping_list.optimized_total_spend = total
    db.commit()
    db.refresh(shopping_list)
    budget_status = build_budget_status(
        current_user,
        projected_spend=shopping_list.expected_total_spend,
        selected_spend=total,
    )
    return BuyPlanSummary(
        shopping_list=shopping_list,
        comparisons=comparisons,
        selected_total_spend=total,
        selected_items_count=count,
        stores_used=stores_used,
        budget_status=budget_status,
        notifications=build_price_notifications(comparisons, current_user.preferred_store),
    )


@router.post("/items", response_model=ShoppingListOut)
def add_manual_item(payload: ShoppingListItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
        if not basket:
            basket = generate_prediction(db, current_user.id, current_prediction_month())
        shopping_list = sync_shopping_list_from_prediction(db, current_user.id, basket)
    db.add(
        ShoppingListItem(
            shopping_list_id=shopping_list.id,
            item_name=payload.item_name,
            normalized_item_name=payload.normalized_item_name,
            category=payload.category,
            predicted_quantity=payload.predicted_quantity,
            average_price_usually_paid=payload.average_price_usually_paid,
            is_recommended=False,
            source="manual",
        )
    )
    db.commit()
    refreshed = _current_list(db, current_user.id)
    return refreshed


@router.delete("/items/{shopping_list_item_id}", response_model=ShoppingListOut)
def remove_item(shopping_list_item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not generated yet")
    item = next((entry for entry in shopping_list.items if entry.id == shopping_list_item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Shopping list item not found")
    db.delete(item)
    db.commit()
    return _current_list(db, current_user.id)


@router.post("/select", response_model=ShoppingListOut)
def select_store(payload: ShoppingListSelectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not generated yet")
    item = next((entry for entry in shopping_list.items if entry.id == payload.shopping_list_item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Shopping list item not found")
    try:
        choose_store_for_item(db, current_user, item, payload.store_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _current_list(db, current_user.id)


@router.post("/bulk/cheapest", response_model=ShoppingListOut)
def choose_cheapest_for_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not generated yet")
    for item in shopping_list.items:
        comparison = compare_item_prices(
            db,
            current_user,
            item.normalized_item_name,
            item.predicted_quantity,
            item.average_price_usually_paid,
            category=item.category,
            item_name=item.item_name,
        )
        if comparison["best_store"]:
            choose_store_for_item(db, current_user, item, comparison["best_store"])
    return _current_list(db, current_user.id)


@router.post("/bulk/store", response_model=ShoppingListOut)
def choose_one_store_for_all(payload: BulkStoreSelection, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    shopping_list = _current_list(db, current_user.id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not generated yet")
    for item in shopping_list.items:
        comparison = compare_item_prices(
            db,
            current_user,
            item.normalized_item_name,
            item.predicted_quantity,
            item.average_price_usually_paid,
            category=item.category,
            item_name=item.item_name,
        )
        if any(option["store_name"] == payload.store_name for option in comparison["options"]):
            choose_store_for_item(db, current_user, item, payload.store_name)
    return _current_list(db, current_user.id)


@router.get("/export.csv")
def export_plan_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = current_plan(db, current_user)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["item_name", "selected_store", "selected_price", "predicted_quantity", "estimated_saving"])
    comparison_by_name = {comparison.normalized_item_name: comparison for comparison in plan.comparisons}
    for item in plan.shopping_list.items:
        selected = item.selected_store_items[-1] if item.selected_store_items else None
        comparison = comparison_by_name.get(item.normalized_item_name)
        writer.writerow(
            [
                item.item_name,
                selected.store_name if selected else "",
                selected.selected_price if selected else "",
                item.predicted_quantity,
                comparison.estimated_saving if comparison else "",
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="buy-plan.csv"'},
    )
