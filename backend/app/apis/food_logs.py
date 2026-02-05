from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import (
    ChildMealLog as ChildMealLogSchema,
    ChildMealLogCreate,
    LatestMealLogResponse,
    Parent as ParentSchema,
)
from app.models.models import Parent as ParentModel, FoodMaster

router = APIRouter()


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    return user




@router.post("/child/{child_id}/meals", response_model=ChildMealLogSchema, status_code=status.HTTP_201_CREATED)
def create_meal_log(
    child_id: int,
    payload: ChildMealLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this child")
    last_log = crud.get_latest_child_meal_log(db, child_id=child_id)
    if last_log is not None:
        today = date.today()
        next_allowed_date = last_log.log_date + timedelta(days=7)
        if today < next_allowed_date:
            days_until_next_allowed = (next_allowed_date - today).days
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"New meal log can only be created after {days_until_next_allowed} day(s)",
            )
    try:
        row = crud.create_child_meal_log(db, child_id=child_id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return row


@router.get("/child/{child_id}/meals/latest", response_model=LatestMealLogResponse)
def get_latest_meal(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this child")
    row = crud.get_latest_child_meal_log(db, child_id=child_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No meal logs found for this child")

    today = date.today()
    next_allowed_date = row.log_date + timedelta(days=7)
    days_until_next_allowed = max(0, (next_allowed_date - today).days)

    food_ids = [item.food_id for item in row.items if item.food_id is not None]
    food_name_map = {}
    if food_ids:
        masters = db.query(FoodMaster).filter(FoodMaster.food_id.in_(food_ids)).all()
        food_name_map = {m.food_id: m.food_name for m in masters}

    items = []
    for item in row.items:
        if item.custom_food_name:
            food_name = item.custom_food_name
        elif item.food_id is not None:
            food_name = food_name_map.get(item.food_id)
        else:
            food_name = None
        items.append(
            {
                "meal_type": item.meal_type,
                "food_name": food_name,
                "serving_size_g": item.serving_size_g,
                "meal_frequency": item.meal_frequency,
            }
        )

    return {
        "log_date": row.log_date,
        "days_until_next_allowed": days_until_next_allowed,
        "items": items,
    }
