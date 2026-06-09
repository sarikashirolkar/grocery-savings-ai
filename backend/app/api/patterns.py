from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.patterns import PurchasePatternOut
from app.services.analytics import analyze_patterns

router = APIRouter(prefix="/patterns", tags=["patterns"])


@router.post("/analyze", response_model=list[PurchasePatternOut])
def analyze(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analyze_patterns(db, current_user.id)


@router.get("", response_model=list[PurchasePatternOut])
def get_patterns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return current_user.patterns
