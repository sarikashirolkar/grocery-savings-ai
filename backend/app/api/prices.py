from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictedBasket
from app.models.pricing import StorePrice
from app.models.user import User
from app.schemas.prices import PriceComparisonItem, StorePriceOut
from app.services.analytics import compare_prices_for_basket
from app.services.seed import seed_store_prices

router = APIRouter(prefix="/prices", tags=["prices"])


@router.post("/seed")
def seed_prices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = seed_store_prices(db)
    return {"message": "Store prices seeded", "count": count}


@router.get("/search", response_model=list[StorePriceOut])
def search_prices(q: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(StorePrice)
    if q:
        query = query.filter(StorePrice.normalized_item_name.contains(q.lower()))
    return query.order_by(StorePrice.store_name.asc()).all()


@router.get("/compare", response_model=list[PriceComparisonItem])
def compare_prices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
    if not basket:
        raise HTTPException(status_code=404, detail="Prediction not generated yet")
    return compare_prices_for_basket(db, basket)
