from typing import List, Optional, Dict
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.db.crud_child_profile import get_child_profile_summary
from app.models.models import Parent as ParentModel


router = APIRouter()


class AgeYM(BaseModel):
    years: int
    months: int


class GrowthSummaryCard(BaseModel):
    weight_for_age: Optional[str] = None
    height_for_age: Optional[str] = None
    trend: str


class VaccinationSummaryCard(BaseModel):
    status: str
    next_due_name: Optional[str] = None
    next_due_recommended_age: Optional[str] = None
    missed_count: int = 0


class MilestonesCard(BaseModel):
    age_appropriate: bool
    delays: List[str] = Field(default_factory=list)


class Risk(BaseModel):
    level: str
    reasons: List[str] = Field(default_factory=list)


class Timeline(BaseModel):
    last_vaccination: Optional[date] = None
    last_illness: Optional[datetime] = None
    last_ai_report: Optional[datetime] = None


class IllnessFlag(BaseModel):
    severity: str
    probability: float
    risk_window_days: int
    message: str


class ChildProfileSummaryResponse(BaseModel):
    child_id: int
    risk: Risk
    growth_summary: GrowthSummaryCard
    major_deficiency: Optional[str] = None
    vaccination: VaccinationSummaryCard
    milestones: MilestonesCard
    ai_percentile: Optional[float] = None
    nutrition_status: Optional[str] = None
    illness_flags: Dict[str, IllnessFlag] = Field(default_factory=dict)
    timeline: Timeline


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view child profiles")
    return user


@router.get("/{child_id}/profile-summary", response_model=ChildProfileSummaryResponse)
def get_child_profile(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    try:
        data = get_child_profile_summary(db, child_id=child_id)
        return data
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile summary: {e}")
