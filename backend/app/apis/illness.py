from typing import List, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import (
    ChildIllnessLog,
    ChildIllnessLogCreate,
    ChildIllnessLogUpdate,
    ResolveIllnessLogRequest,
)
from app.models.models import Parent as ParentModel

router = APIRouter()


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can manage illness logs")
    return user


@router.post("/create/{child_id}", response_model=ChildIllnessLog, status_code=status.HTTP_201_CREATED)
def create_illness_log(
    child_id: int,
    payload: ChildIllnessLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    # Ensure child belongs to this parent
    child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return crud.create_child_illness_log(db, child_id=child_id, payload=payload)


@router.get("/list/{child_id}", response_model=List[ChildIllnessLog])
def list_illness_logs(
    child_id: int,
    status_filter: Literal['current','resolved','history','all'] = Query('all', alias='status'),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return crud.list_child_illness_logs(db, child_id=child_id, status=status_filter)


@router.get("/get/{log_id}", response_model=ChildIllnessLog)
def get_illness_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    row = crud.get_child_illness_log_by_id(db, log_id=log_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    # ensure ownership
    child = crud.get_child_by_id_and_parent(db, child_id=row.child_id, parent_id=parent.parent_id)
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found for this log")
    return row


@router.put("/update/{log_id}", response_model=ChildIllnessLog)
def update_illness_log(
    log_id: int,
    updates: ChildIllnessLogUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    row = crud.get_child_illness_log_by_id(db, log_id=log_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    child = crud.get_child_by_id_and_parent(db, child_id=row.child_id, parent_id=parent.parent_id)
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found for this log")
    return crud.update_child_illness_log(db, row=row, updates=updates)


@router.post("/resolve/{log_id}", response_model=ChildIllnessLog)
def resolve_illness_log(
    log_id: int,
    req: ResolveIllnessLogRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    row = crud.get_child_illness_log_by_id(db, log_id=log_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    child = crud.get_child_by_id_and_parent(db, child_id=row.child_id, parent_id=parent.parent_id)
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found for this log")
    return crud.resolve_child_illness_log(db, row=row, req=req)
