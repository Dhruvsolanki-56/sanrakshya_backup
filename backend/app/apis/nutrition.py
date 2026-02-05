from datetime import date
from typing import Optional, Dict, Any
from pathlib import Path
import json

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.apis.deps import get_db, get_current_user
from app.db import crud
from app.db import crud_nutrition
from app.models.models import Parent as ParentModel
from app.schemas.schemas import WeeklyNutritionSummaryResponse

router = APIRouter()


@router.post("/seed", response_model=dict)
def seed_nutrition_requirements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    crud.seed_nutrition_requirements(db)
    return {"status": "ok"}


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    return user


@router.get("/child/{child_id}/weekly-summary", response_model=WeeklyNutritionSummaryResponse)
def get_child_weekly_nutrition_summary(
    child_id: int,
    start: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this child")

    summary = crud_nutrition.get_child_weekly_nutrition_summary(db, child_id=child_id, week_start=start)
    return summary


@router.post("/seed-recipes", response_model=dict)
def seed_nutrition_recipes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    base_dir = Path(__file__).resolve().parents[1]
    recipe_path = base_dir / "db" / "recipe.json"

    with recipe_path.open("r", encoding="utf-8") as f:
        payload: Dict[str, Any] = json.load(f)

    result = crud_nutrition.seed_nutrition_recipes(db, payload=payload)
    return {"status": "ok", **result}
