from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import FoodBrief as FoodSchema, FoodAgeGroupEnum
from app.models.models import Parent as ParentModel

router = APIRouter()


@router.post("/seed", response_model=dict)
def seed_food_master(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    crud.seed_food_master(db)
    return {"status": "ok"}


@router.get("/{age_group}", response_model=List[FoodSchema])
def list_foods(
    age_group: FoodAgeGroupEnum,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    crud.seed_food_master(db)
    return crud.list_foods_by_age_group(db, age_group)


@router.get("/child/{child_id}", response_model=List[FoodSchema])
def list_foods_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=current_user.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this child")
    crud.seed_food_master(db)
    group = crud.compute_child_age_group(db_child.date_of_birth)
    gmap = {
        'Infant': FoodAgeGroupEnum.INFANT,
        'Toddler': FoodAgeGroupEnum.TODDLER,
        'Preschool': FoodAgeGroupEnum.PRESCHOOL,
        'SchoolAge': FoodAgeGroupEnum.SCHOOLAGE,
    }
    food_group = gmap.get(group.value if hasattr(group, 'value') else str(group)) or FoodAgeGroupEnum.ALL
    return crud.list_foods_by_age_group(db, food_group)
