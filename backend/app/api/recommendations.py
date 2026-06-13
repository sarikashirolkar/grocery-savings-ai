from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictedBasket
from app.models.pricing import SavingsRecommendation
from app.models.user import User
from app.schemas.prices import RecommendationOut
from app.services.analytics import generate_recommendation, recommendation_payload

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=RecommendationOut)
def generate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    basket = db.query(PredictedBasket).filter_by(user_id=current_user.id).order_by(PredictedBasket.id.desc()).first()
    if not basket:
        raise HTTPException(status_code=404, detail="Prediction not generated yet")
    recommendation = generate_recommendation(db, current_user.id, basket)
    return recommendation_payload(db, recommendation, basket)


@router.get("/current", response_model=RecommendationOut)
def current(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recommendation = (
        db.query(SavingsRecommendation)
        .filter_by(user_id=current_user.id)
        .order_by(SavingsRecommendation.id.desc())
        .first()
    )
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not generated yet")
    basket = (
        db.query(PredictedBasket)
        .filter_by(user_id=current_user.id, prediction_month=recommendation.prediction_month)
        .order_by(PredictedBasket.id.desc())
        .first()
    )
    return recommendation_payload(db, recommendation, basket)
