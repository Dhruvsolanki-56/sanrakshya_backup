from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.apis.deps import get_current_user, get_db
from app.schemas.schemas import Parent, ParentUpdate, ParentHomeSummary, ParentHomeChildSummary, ParentProfile
from app.doctor.schemas import Doctor
from app.db import crud
from app.db.crud_child_profile import get_child_profile_summary
from app.models.models import Parent as ParentModel
from app.services import profile_photo_storage

router = APIRouter()

@router.get("/me", response_model=Doctor | Parent)
async def read_users_me(current_user: Doctor | Parent = Depends(get_current_user)):
    
    return current_user

@router.get("/current-parent", response_model=Parent)
async def get_current_parent(
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")
    return current_user

@router.get("/parent-home", response_model=ParentHomeSummary)
async def read_user_home(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access this endpoint")

    parent_photo_row = crud.get_parent_profile_photo(db, parent_id=current_user.parent_id)
    parent_photo_url = "/users/parent-photo" if parent_photo_row else None

    db_children = crud.list_children_by_parent(db, parent_id=current_user.parent_id)
    summaries = []
    for ch in db_children:
        child_photo_row = crud.get_child_profile_photo(db, child_id=ch.child_id)
        child_photo_url = f"/children/{ch.child_id}/photo" if child_photo_row else None
        try:
            prof = get_child_profile_summary(db, child_id=ch.child_id)
        except Exception:
            prof = None
        if prof is None:
            summaries.append(
                ParentHomeChildSummary(
                    child_id=ch.child_id,
                    name=ch.full_name,
                    age_years=0,
                    age_months=0,
                    photo_url=child_photo_url,
                    gender=ch.gender,
                    blood_group=ch.blood_group,
                )
            )
            continue
        age = prof.get("age") or {}
        try:
            age_years = int(age.get("years") or 0)
        except (TypeError, ValueError):
            age_years = 0
        try:
            age_months = int(age.get("months") or 0)
        except (TypeError, ValueError):
            age_months = 0
        ai_percentile = prof.get("ai_percentile")
        nutrition_status = prof.get("nutrition_status")
        milestones = prof.get("milestones") or {}
        age_appropriate = milestones.get("age_appropriate")
        risk = prof.get("risk") or {}
        risk_level = risk.get("level")
        # WHO-style growth compliance: use AI growth percentile (already from WHO curves),
        # clamped to 0-100, as the growth component
        try:
            p = float(ai_percentile) if ai_percentile is not None else None
        except (TypeError, ValueError):
            p = None
        if p is None:
            growth_comp = 80.0
        else:
            if p < 0.0:
                p = 0.0
            if p > 100.0:
                p = 100.0
            growth_comp = p
        if nutrition_status == "Normal":
            nutrition_comp = 100.0
        elif nutrition_status == "Nutrition risk":
            nutrition_comp = 60.0
        else:
            nutrition_comp = 80.0
        if age_appropriate is True:
            milestone_comp = 100.0
        elif age_appropriate is False:
            milestone_comp = 60.0
        else:
            milestone_comp = 80.0
        progress = (growth_comp + nutrition_comp + milestone_comp) / 3.0
        progress_percent = round(progress, 1)
        if progress_percent >= 85.0:
            progress_label = "On Track"
        elif progress_percent >= 70.0:
            progress_label = "Monitor"
        else:
            progress_label = "Needs Action"
        vac = prof.get("vaccination") or {}
        vac_status = vac.get("status")
        next_vac_name = vac.get("next_due_name")
        next_vac_age = vac.get("next_due_recommended_age")
        illness_alerts = prof.get("illness_flags") or {}
        # Add milestone delay info into alerts if any
        delays = milestones.get("delays") or []
        if delays:
            illness_alerts = dict(illness_alerts)
            illness_alerts["milestones"] = {
                "severity": "Delay",
                "items": delays,
            }
        summaries.append(
            ParentHomeChildSummary(
                child_id=prof.get("child_id", ch.child_id),
                name=ch.full_name,
                age_years=age_years,
                age_months=age_months,
                photo_url=child_photo_url,
                gender=prof.get("gender", ch.gender),
                blood_group=prof.get("blood_group", ch.blood_group),
                growth_dev_progress_percent=progress_percent,
                growth_dev_progress_label=progress_label,
                vaccination_status=vac_status,
                next_vaccine_name=next_vac_name,
                next_vaccine_recommended_age=next_vac_age,
                illness_alerts=illness_alerts,
                nutrition_status=nutrition_status,
                risk_level=risk_level,
            )
        )
    return ParentHomeSummary(
        full_name=current_user.full_name,
        email=current_user.email,
        phone_number=current_user.phone_number,
        parent_photo_url=parent_photo_url,
        children=summaries,
    )


@router.post("/parent-photo", status_code=status.HTTP_201_CREATED)
async def upload_parent_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can upload parent photo")
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")
    if not (file.content_type or "").lower().startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image uploads are allowed")

    rel_path = profile_photo_storage.build_parent_photo_path(current_user.parent_id, file.filename)
    profile_photo_storage.save_upload_to_path(rel_path, file)

    abs_path = profile_photo_storage.absolute_path(rel_path)
    size = abs_path.stat().st_size if abs_path.exists() else None
    crud.upsert_parent_profile_photo(
        db,
        parent_id=current_user.parent_id,
        photo_url=rel_path,
        mime_type=file.content_type,
        file_size=size,
    )
    return {"photo_url": "/users/parent-photo"}


@router.get("/parent-photo", response_class=StreamingResponse)
async def get_parent_photo(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can access parent photo")
    row = crud.get_parent_profile_photo(db, parent_id=current_user.parent_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent photo not found")

    path = profile_photo_storage.absolute_path(row.photo_url)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent photo file missing on server")

    def file_iterator():
        with path.open("rb") as f:
            yield from iter(lambda: f.read(1024 * 1024), b"")

    return StreamingResponse(file_iterator(), media_type=row.mime_type or "application/octet-stream")


@router.delete("/parent-photo", status_code=status.HTTP_204_NO_CONTENT)
async def delete_parent_photo(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can delete parent photo")

    row = crud.get_parent_profile_photo(db, parent_id=current_user.parent_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent photo not found")

    profile_photo_storage.delete_relative_path(row.photo_url)
    crud.delete_parent_profile_photo(db, parent_id=current_user.parent_id)
    return None

@router.put("/update-parent", response_model=ParentProfile)
async def update_parent_profile(
    updates: ParentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(current_user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can update parent profile")

    # Uniqueness checks (exclude self)
    if updates.email is not None:
        existing = crud.get_parent_by_email_any(db, email=updates.email)
        if existing and existing.parent_id != current_user.parent_id:
            raise HTTPException(status_code=400, detail="Email already in use")

    if updates.phone_number is not None:
        existing = crud.get_parent_by_phone_any(db, phone_number=updates.phone_number)
        if existing and existing.parent_id != current_user.parent_id:
            raise HTTPException(status_code=400, detail="Phone number already in use")

    updated = crud.update_parent(db, db_parent=current_user, updates=updates)
    return updated
