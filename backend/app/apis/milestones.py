from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import (
    ChildMilestone as ChildMilestoneSchema,
    ChildMilestoneStatus as ChildMilestoneStatusSchema,
    ChildMilestoneStatusWithMilestone,
    ChildMilestoneWithFlags,
    AddChildMilestoneToChildRequest,
)
from app.models.models import Parent as ParentModel, ChildMilestone as ChildMilestoneModel

router = APIRouter()


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    return user


@router.post("/seed-all", response_model=dict)
def seed_all_milestones(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Seed milestones idempotently
    crud.seed_all_child_milestones(db)
    return {"status": "ok"}


@router.get("/child/{child_id}/milestones", response_model=List[ChildMilestoneWithFlags])
def list_child_milestones(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    # Ensure seeds are present (idempotent)
    crud.seed_all_child_milestones(db)
    # Compute current group and fetch milestones + any existing statuses
    group = crud.compute_child_age_group(db_child.date_of_birth)
    milestones = crud.list_milestones_by_age_group(db, group)
    existing_statuses = crud.list_child_milestone_statuses_by_group(db, child_id=child_id, age_group=group)
    status_map = {s.milestone_id: s for s in existing_statuses}

    # Synthesize response: if no DB status, return defaults without inserting
    result = []
    for m in milestones:
        s = status_map.get(m.id)
        if s is not None:
            is_archived = bool(s.achieved_date)
            special = bool(s.special_milestone)
        else:
            is_archived = False
            special = False
        result.append({'milestone': m, 'is_archived': is_archived, 'special_milestone': special})
    return result


@router.get("/child/{child_id}/milestone-statuses", response_model=List[ChildMilestoneStatusWithMilestone])
def list_child_milestone_statuses(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    # Return statuses; relationship provides milestone details
    return crud.list_child_milestone_statuses(db, child_id=child_id)

@router.post("/child/{child_id}/milestones", response_model=ChildMilestoneStatusSchema)
def add_child_milestone_status(
    child_id: int,
    body: AddChildMilestoneToChildRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    # Validate milestone exists
    milestone = db.query(ChildMilestoneModel).filter(ChildMilestoneModel.id == body.milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    # Prevent duplicates
    existing = crud.get_child_milestone_status(db, child_id=child_id, milestone_id=body.milestone_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Milestone already recorded for this child")
    # Create new status
    from app.schemas.schemas import ChildMilestoneStatusCreate
    payload = ChildMilestoneStatusCreate(
        child_id=child_id,
        milestone_id=body.milestone_id,
        achieved_date=body.achieved_date,
        difficulty=body.difficulty,
        special_milestone=body.special_milestone,
    )
    return crud.upsert_child_milestone_status(db, payload=payload)
