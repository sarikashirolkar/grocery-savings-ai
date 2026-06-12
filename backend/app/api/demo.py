from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.demo import DemoRegionOut, DemoRegionUpdate
from app.services.seed import available_demo_regions, get_active_demo_region, seed_demo_data, set_active_demo_region

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/region", response_model=DemoRegionOut)
def get_region(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DemoRegionOut(active_region=get_active_demo_region(db), available_regions=available_demo_regions())


@router.post("/region", response_model=DemoRegionOut)
def switch_region(payload: DemoRegionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.region not in available_demo_regions():
        raise HTTPException(status_code=400, detail="Unsupported demo region")
    set_active_demo_region(db, payload.region)
    seed_demo_data(db, region=payload.region, force=True)
    return DemoRegionOut(active_region=payload.region, available_regions=available_demo_regions())
