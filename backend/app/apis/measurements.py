from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import (
    ChildAnthropometry as ChildAnthropometrySchema,
    ChildAnthropometryCreate,
)
from app.models.models import Parent as ParentModel
from datetime import date

router = APIRouter()


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    return user


@router.post("/child/{child_id}/measurements", response_model=ChildAnthropometrySchema, status_code=status.HTTP_201_CREATED)
def create_measurement(
    child_id: int,
    payload: ChildAnthropometryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this child")
    # Enforce MUAC only for children > 6 months (using today's date as log date)
    if payload.muac_cm is not None:
        dob = db_child.date_of_birth
        if isinstance(dob, date):
            months = int((date.today() - dob).days / 30.44)
            if months < 6:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MUAC is applicable only for children older than 6 months")
    try:
        row = crud.create_child_anthropometry(db, child_id=child_id, payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return row
