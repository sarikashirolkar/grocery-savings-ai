from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictedBasket
from app.models.user import User
from app.schemas.prediction import PredictedBasketOut
from app.services.analytics import current_prediction_month, generate_prediction

router = APIRouter(prefix="/prediction", tags=["prediction"])


@router.post("/generate", response_model=PredictedBasketOut)
def generate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return generate_prediction(db, current_user.id, current_prediction_month())


@router.get("/next-basket", response_model=PredictedBasketOut)
def get_next_basket(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
    if not basket:
        raise HTTPException(status_code=404, detail="Prediction not generated yet")
    return basket
