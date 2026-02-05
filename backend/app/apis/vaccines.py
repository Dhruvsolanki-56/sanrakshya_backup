from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
import re

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import (
    VaccinationSchedule as VaccinationScheduleSchema,
    ChildVaccineStatus as ChildVaccineStatusSchema,
    ChildVaccineStatusBrief,
    ChildVaccineStatusUpdate,
    RecordVaccineGivenRequest,
    VaccinationAgeGroupEnum,
    Parent as ParentSchema,
)
from app.models.models import Parent as ParentModel

router = APIRouter()


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    return user


@router.post("/seed-all", response_model=dict)
def seed_all_schedules(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Seed all groups idempotently
    crud.seed_all_vaccination_schedules(db)
    return {"status": "ok"}


@router.post("/normalize-text", response_model=dict)
def normalize_text_fields(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # One-time maintenance: fix mojibake like '4û6 years' to '4-6 years'
    result = crud.normalize_all_text_fields(db)
    return {"status": "ok", **result}


@router.get("/schedule/{age_group}", response_model=List[VaccinationScheduleSchema])
def get_schedule_by_group(
    age_group: VaccinationAgeGroupEnum,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    crud.seed_all_vaccination_schedules(db)
    return crud.list_schedule_by_age_group(db, age_group)



@router.get("/child/{child_id}/statuses", response_model=List[ChildVaccineStatusBrief])
def list_child_statuses_for_current_group(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    crud.seed_all_vaccination_schedules(db)
    group = crud.compute_child_age_group(db_child.date_of_birth)
    # Do NOT create rows here; instead synthesize from schedule + any existing rows
    schedules = crud.list_schedule_by_age_group(db, age_group=group)
    existing_rows = crud.list_child_vaccine_statuses_by_group(db, child_id=child_id, age_group=group)
    existing_map = {(r.schedule_id, r.dose_number): r for r in existing_rows}

    def normalize(s: str) -> str:
        if not s:
            return s
        return (
            s.replace('\u2013', '-')
             .replace('\u2014', '-')
             .replace('\u2212', '-')
             .replace('\u2011', '-')
             .replace('\u00A0', ' ')
        )

    def parse_due_date(age_text: str, dose_number: int, dob: date) -> date | None:
        if not age_text:
            return None
        txt = normalize(age_text).lower()
        # Handle lists like "6, 10, 14 weeks"
        m_list = re.findall(r"(\d+)\s*,?", txt)
        unit = None
        if 'week' in txt:
            unit = 'week'
        elif 'month' in txt:
            unit = 'month'
        elif 'year' in txt:
            unit = 'year'

        if 'at birth' in txt:
            return dob  # due at DOB

        # Range like '15-18 months' => take upper bound
        m_range = re.search(r"(\d+)\s*[-]\s*(\d+)", txt)
        if m_range and unit:
            upper = int(m_range.group(2))
            if unit == 'week':
                return dob + timedelta(days=upper * 7)
            if unit == 'month':
                return dob + timedelta(days=upper * 30)
            if unit == 'year':
                return dob + timedelta(days=upper * 365)

        # Comma list per dose
        if m_list and unit:
            idx = max(0, min(len(m_list)-1, dose_number-1))
            val = int(m_list[idx])
            if unit == 'week':
                return dob + timedelta(days=val * 7)
            if unit == 'month':
                return dob + timedelta(days=val * 30)
            if unit == 'year':
                return dob + timedelta(days=val * 365)

        # Single value
        m_single = re.search(r"(\d+)", txt)
        if m_single and unit:
            val = int(m_single.group(1))
            if unit == 'week':
                return dob + timedelta(days=val * 7)
            if unit == 'month':
                return dob + timedelta(days=val * 30)
            if unit == 'year':
                return dob + timedelta(days=val * 365)

        # Recurring phrases
        if 'every year' in txt:
            # first annual due at 12 months
            return dob + timedelta(days=365)
        if 'every 6 months' in txt:
            # assume first due at 9 months if present, else 6 months
            if '9 months' in txt:
                return dob + timedelta(days=9 * 30)
            return dob + timedelta(days=6 * 30)

        return None

    today = date.today()
    result: list[dict] = []
    from app.schemas.schemas import VaccineStatusEnum as _VSE
    for sch in schedules:
        total = sch.doses_required or 1
        # Count completed doses for this schedule
        completed = 0
        for dose in range(1, total + 1):
            r = existing_map.get((sch.id, dose))
            if r and (getattr(r, 'actual_date', None) or r.status == _VSE.COMPLETED):
                completed += 1

        remaining = max(0, total - completed)

        if remaining == 0:
            display_status = _VSE.COMPLETED
            # No next due date needed
        else:
            # Next dose index is completed+1
            next_dose = completed + 1
            due = parse_due_date(sch.recommended_age, next_dose, db_child.date_of_birth)
            if due is not None and today > due:
                display_status = _VSE.MISSED
            else:
                display_status = _VSE.PENDING

        result.append({
            'remaining_doses': remaining,  # remaining doses to take
            'status': display_status,
            'schedule': sch,
        })

    return result


@router.patch("/status/{status_id}", response_model=ChildVaccineStatusSchema)
def update_child_status(
    status_id: int,
    updates: ChildVaccineStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_status = crud.get_child_vaccine_status(db, status_id=status_id)
    if not db_status:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Status record not found")
    # Ownership check: ensure this status belongs to a child of the current parent
    db_child = crud.get_child_by_id_and_parent(db, child_id=db_status.child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this child's vaccine record")
    return crud.update_child_vaccine_status(db, db_status=db_status, updates=updates)


@router.post("/child/{child_id}/given", response_model=ChildVaccineStatusSchema)
def record_vaccine_given(
    child_id: int,
    payload: RecordVaccineGivenRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    try:
        row = crud.record_vaccine_given(
            db,
            child_id=child_id,
            schedule_id=payload.schedule_id,
            dose_number=1,
            given_date=payload.given_date,
            side_effects=payload.side_effects,
            notes=payload.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    return row


