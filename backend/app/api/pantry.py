from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.pantry import PantryItem
from app.models.user import User
from app.schemas.pantry import PantryItemOut, PantrySyncOut
from app.services.pantry import sync_pantry

router = APIRouter(prefix="/pantry", tags=["pantry"])


@router.post("/sync", response_model=PantrySyncOut)
def sync(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = sync_pantry(db, current_user.id)
    return PantrySyncOut(synced_count=len(items), items=items)


@router.get("/current", response_model=list[PantryItemOut])
def current(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PantryItem).filter_by(user_id=current_user.id).order_by(PantryItem.days_remaining.asc()).all()
