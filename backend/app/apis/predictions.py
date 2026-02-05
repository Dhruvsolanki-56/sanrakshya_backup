from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.models.models import Parent as ParentModel, ChildPredictionReport, ChildMealLog as ChildMealLogModel
from app.schemas.schemas import (
    VaccinationAgeGroupEnum,
    ChildPredictionResponse,
    PredictionDataframe,
    ChildPredictionReportBase,
    ChildPredictionTrendPoint,
)
from app.services.prediction_common import build_features_for_group, dataframe_for_model
from app.services.prediction_infant import predict_infant, INFANT_FEATURES
from app.services.prediction_toddler import predict_toddler, TODDLER_FEATURES
from app.services.prediction_preschool import predict_preschool, PRESCHOOL_FEATURES
from app.services.prediction_schoolage import predict_schoolage, SCHOOLAGE_FEATURES

router = APIRouter()


def _zscore_flag(z):
    try:
        if z is None:
            return None
        z = float(z)
    except (TypeError, ValueError):
        return None
    if z < -3:
        return "Very low for age (needs medical review)"
    if z < -2:
        return "Low for age"
    if z <= 2:
        return "Within normal range"
    if z <= 3:
        return "High for age"
    return "Very high for age (needs medical review)"


def _illness_risk_flag(p):
    try:
        if p is None:
            return None
        p = float(p)
    except (TypeError, ValueError):
        return None
    if p < 0.3:
        return "Low"
    if p < 0.6:
        return "Mild"
    if p < 0.8:
        return "Moderate"
    return "High"


def _milestone_delay_flag(p):
    try:
        if p is None:
            return None
        p = float(p)
    except (TypeError, ValueError):
        return None
    if p < 0.3:
        return "On track"
    if p < 0.6:
        return "Slight delay risk"
    if p < 0.8:
        return "Delay risk"
    return "High delay risk"


def _add_prediction_flags(row):
    try:
        setattr(row, "weight_zscore_flag", _zscore_flag(getattr(row, "weight_zscore", None)))
    except Exception:
        pass
    try:
        setattr(row, "height_zscore_flag", _zscore_flag(getattr(row, "height_zscore", None)))
    except Exception:
        pass
    try:
        setattr(row, "fever_risk_flag", _illness_risk_flag(getattr(row, "prob_fever", None)))
        setattr(row, "cold_risk_flag", _illness_risk_flag(getattr(row, "prob_cold", None)))
        setattr(row, "diarrhea_risk_flag", _illness_risk_flag(getattr(row, "prob_diarrhea", None)))
    except Exception:
        pass
    try:
        setattr(row, "milestone_sit_delay_flag", _milestone_delay_flag(getattr(row, "milestone_sit_delay_prob", None)))
        setattr(row, "milestones_language_delay_flag", _milestone_delay_flag(getattr(row, "milestones_language_delay_prob", None)))
        setattr(row, "milestones_walking_delay_flag", _milestone_delay_flag(getattr(row, "milestones_walking_delay_prob", None)))
        setattr(row, "milestone_speech_delay_flag", _milestone_delay_flag(getattr(row, "milestone_speech_delay_prob", None)))
        setattr(row, "milestone_social_play_delay_flag", _milestone_delay_flag(getattr(row, "milestone_social_play_delay_prob", None)))
        setattr(row, "milestone_learning_delay_flag", _milestone_delay_flag(getattr(row, "milestone_learning_delay_prob", None)))
        setattr(row, "milestone_social_skill_delay_flag", _milestone_delay_flag(getattr(row, "milestone_social_skill_delay_prob", None)))
    except Exception:
        pass


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can request predictions for their children")
    return user


@router.post("/child/{child_id}", response_model=ChildPredictionResponse)
def get_predictions_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    try:
        group = crud.compute_child_age_group(db_child.date_of_birth)
        features, info = build_features_for_group(db, db_child, group)
        required_missing = info.get("required_missing", [])
        # If required inputs are missing, return a 422 error with details
        if required_missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": "Missing required inputs for prediction",
                    "required_missing": required_missing,
                    "age_group": info.get("age_group"),
                    "is_existing": bool(info.get("is_existing", False)),
                },
            )
        # Check latest existing prediction report for this child
        last_report: ChildPredictionReport | None = (
            db.query(ChildPredictionReport)
            .filter(ChildPredictionReport.child_id == child_id)
            .order_by(ChildPredictionReport.created_at.desc())
            .first()
        )

        # Fields that should trigger a re-prediction if changed (exclude age fields)
        change_sensitive_fields = [
            "is_existing",
            "sex",
            "weight_kg",
            "height_cm",
            "muac_cm",
            "bmi",
            "weight_zscore",
            "height_zscore",
            "feeding_type",
            "feeding_frequency",
            "vaccination_status",
            "sleep_hours",
            "illness_fever",
            "illness_cold",
            "illness_diarrhea",
            "milestone_smile",
            "milestone_roll",
            "milestone_sit",
            "milestones_language",
            "milestones_walking",
            "milestone_speech_clarity",
            "milestone_social_play",
            "milestone_learning_skill",
            "milestone_social_skill",
            "avg_weight_gain",
            "weight_velocity",
            "illness_freq_trend",
        ]

        use_cached = False
        if last_report is not None and last_report.age_group == group:
            # Compare non-age inputs; if all equal, we can reuse the last predictions
            use_cached = True
            for field in change_sensitive_fields:
                if features.get(field) != getattr(last_report, field):
                    use_cached = False
                    break

            # Additionally, if there are newer meal logs than the last report,
            # force a fresh prediction so food pattern changes are reflected.
            if use_cached:
                latest_meal_log = (
                    db.query(ChildMealLogModel)
                    .filter(ChildMealLogModel.child_id == child_id)
                    .order_by(ChildMealLogModel.created_at.desc())
                    .first()
                )
                if latest_meal_log is not None and latest_meal_log.created_at > last_report.created_at:
                    use_cached = False

        # Route to category-specific predictors (or reuse cached predictions)
        if group == VaccinationAgeGroupEnum.INFANT:
            expected_cols = INFANT_FEATURES
        elif group == VaccinationAgeGroupEnum.TODDLER:
            expected_cols = TODDLER_FEATURES
        elif group == VaccinationAgeGroupEnum.PRESCHOOL:
            expected_cols = PRESCHOOL_FEATURES
        else:
            expected_cols = SCHOOLAGE_FEATURES
        if use_cached and last_report is not None:
            # Reuse last predictions; only age fields may differ
            preds = {
                "growth_percentile": last_report.growth_percentile,
                "nutrition_flag": last_report.nutrition_flag,
                "prob_fever": last_report.prob_fever,
                "prob_cold": last_report.prob_cold,
                "prob_diarrhea": last_report.prob_diarrhea,
                "milestone_sit_delay_prob": last_report.milestone_sit_delay_prob,
                "milestones_language_delay_prob": last_report.milestones_language_delay_prob,
                "milestones_walking_delay_prob": last_report.milestones_walking_delay_prob,
                "milestone_speech_delay_prob": last_report.milestone_speech_delay_prob,
                "milestone_social_play_delay_prob": last_report.milestone_social_play_delay_prob,
                "milestone_learning_delay_prob": last_report.milestone_learning_delay_prob,
                "milestone_social_skill_delay_prob": last_report.milestone_social_skill_delay_prob,
            }
        else:
            # Run models to get new predictions based on current features
            if group == VaccinationAgeGroupEnum.INFANT:
                preds = predict_infant(features)
            elif group == VaccinationAgeGroupEnum.TODDLER:
                preds = predict_toddler(features)
            elif group == VaccinationAgeGroupEnum.PRESCHOOL:
                preds = predict_preschool(features)
            else:
                preds = predict_schoolage(features)

        # If a milestone is already archived (flag = 1), do not keep its delay probability
        milestone_flag_to_prob = {
            "milestone_sit": "milestone_sit_delay_prob",
            "milestones_language": "milestones_language_delay_prob",
            "milestones_walking": "milestones_walking_delay_prob",
            "milestone_speech_clarity": "milestone_speech_delay_prob",
            "milestone_social_play": "milestone_social_play_delay_prob",
            "milestone_learning_skill": "milestone_learning_delay_prob",
            "milestone_social_skill": "milestone_social_skill_delay_prob",
        }
        for flag_field, prob_field in milestone_flag_to_prob.items():
            try:
                if features.get(flag_field) == 1:
                    preds[prob_field] = None
            except Exception:
                # If anything goes wrong, fail silently and keep existing value
                continue

        # Build a DataFrame-like payload with ordered model features and predictions
        df = dataframe_for_model(features, expected_cols)
        feature_values = list(map(lambda x: x if x is not None else 0, df.iloc[0].tolist()))

        # Round key prediction outputs to 3 decimal places for compact storage/display
        def _round_pred_value(name: str, value):
            if value is None:
                return None
            # Integers (e.g., nutrition_flag) are left as-is
            if name in {"nutrition_flag"}:
                return value
            # Main probability / score outputs -> 3 decimals
            if name in {
                "growth_percentile",
                "prob_fever",
                "prob_cold",
                "prob_diarrhea",
                "milestone_sit_delay_prob",
                "milestones_language_delay_prob",
                "milestones_walking_delay_prob",
                "milestone_speech_delay_prob",
                "milestone_social_play_delay_prob",
                "milestone_learning_delay_prob",
                "milestone_social_skill_delay_prob",
            }:
                try:
                    return round(float(value), 3)
                except (TypeError, ValueError):
                    return value
            return value

        preds = {k: _round_pred_value(k, v) for k, v in preds.items()}

        pred_cols = list(preds.keys())
        pred_values = [preds[k] for k in pred_cols]
        combined_columns = expected_cols + pred_cols
        combined_values = feature_values + pred_values

        dataframe_payload = PredictionDataframe(columns=combined_columns, values=[combined_values])

        # Persist a unified prediction report row for potential retraining
        if not use_cached:
            report = ChildPredictionReport(
                child_id=db_child.child_id,
                age_group=group,
                is_existing=features.get("is_existing"),
                age_days=features.get("age_days"),
                age_months=features.get("age_months"),
                age_years=features.get("age_years"),
                sex=features.get("sex"),
                weight_kg=features.get("weight_kg"),
                height_cm=features.get("height_cm"),
                muac_cm=features.get("muac_cm"),
                bmi=features.get("bmi"),
                weight_zscore=features.get("weight_zscore"),
                height_zscore=features.get("height_zscore"),
                feeding_type=features.get("feeding_type"),
                feeding_frequency=features.get("feeding_frequency"),
                vaccination_status=features.get("vaccination_status"),
                sleep_hours=features.get("sleep_hours"),
                illness_fever=features.get("illness_fever"),
                illness_cold=features.get("illness_cold"),
                illness_diarrhea=features.get("illness_diarrhea"),
                milestone_smile=features.get("milestone_smile"),
                milestone_roll=features.get("milestone_roll"),
                milestone_sit=features.get("milestone_sit"),
                milestones_language=features.get("milestones_language"),
                milestones_walking=features.get("milestones_walking"),
                milestone_speech_clarity=features.get("milestone_speech_clarity"),
                milestone_social_play=features.get("milestone_social_play"),
                milestone_learning_skill=features.get("milestone_learning_skill"),
                milestone_social_skill=features.get("milestone_social_skill"),
                avg_weight_gain=features.get("avg_weight_gain"),
                weight_velocity=features.get("weight_velocity"),
                illness_freq_trend=features.get("illness_freq_trend"),
                growth_percentile=preds.get("growth_percentile"),
                nutrition_flag=preds.get("nutrition_flag"),
                prob_fever=preds.get("prob_fever"),
                prob_cold=preds.get("prob_cold"),
                prob_diarrhea=preds.get("prob_diarrhea"),
                milestone_sit_delay_prob=preds.get("milestone_sit_delay_prob"),
                milestones_language_delay_prob=preds.get("milestones_language_delay_prob"),
                milestones_walking_delay_prob=preds.get("milestones_walking_delay_prob"),
                milestone_speech_delay_prob=preds.get("milestone_speech_delay_prob"),
                milestone_social_play_delay_prob=preds.get("milestone_social_play_delay_prob"),
                milestone_learning_delay_prob=preds.get("milestone_learning_delay_prob"),
                milestone_social_skill_delay_prob=preds.get("milestone_social_skill_delay_prob"),
            )
            db.add(report)
            db.commit()
            report_id = report.id
            created_at = report.created_at
        else:
            # Using cached report
            if last_report is not None:
                report_id = last_report.id
                created_at = last_report.created_at
            else:
                report_id = None
                created_at = None

        return ChildPredictionResponse(
            age_group=info.get("age_group"),
            is_existing=bool(info.get("is_existing", False)),
            required_missing=required_missing,
            report_id=report_id,
            status="ok",
            created_at=created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@router.get("/child/{child_id}/reports", response_model=list[ChildPredictionReportBase])
def list_prediction_reports_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    rows: list[ChildPredictionReport] = (
        db.query(ChildPredictionReport)
        .filter(ChildPredictionReport.child_id == child_id)
        .order_by(ChildPredictionReport.created_at.desc())
        .all()
    )
    # Mask low illness probabilities (<0.5) and milestone delay probabilities (<0.3),
    # and then add human-readable labels and flags
    masked: list[ChildPredictionReport] = []
    for r in rows:
        # Hide low illness risks and milestone delay probabilities in response
        for attr in ("prob_fever", "prob_cold", "prob_diarrhea"):
            try:
                v = getattr(r, attr)
                if v is not None and float(v) < 0.5:
                    setattr(r, attr, None)
            except (TypeError, ValueError):
                continue

        # Milestone delay probabilities: hide if < 0.3 (30%)
        for attr in (
            "milestone_sit_delay_prob",
            "milestones_language_delay_prob",
            "milestones_walking_delay_prob",
            "milestone_speech_delay_prob",
            "milestone_social_play_delay_prob",
            "milestone_learning_delay_prob",
            "milestone_social_skill_delay_prob",
        ):
            try:
                v = getattr(r, attr)
                if v is not None and float(v) < 0.3:
                    setattr(r, attr, None)
            except (TypeError, ValueError):
                continue

        # After masking, derive parent-friendly flags from the remaining probabilities
        _add_prediction_flags(r)

        # Feeding type label per age group
        ft = r.feeding_type
        ag = r.age_group
        label = None
        try:
            # VaccinationAgeGroupEnum is used on the model
            if ag == VaccinationAgeGroupEnum.INFANT:
                mapping = {0: "Breastmilk", 1: "Formula", 2: "Mixed"}
            elif ag == VaccinationAgeGroupEnum.TODDLER:
                mapping = {0: "FamilyFood", 1: "Mixed", 2: "Milk"}
            elif ag == VaccinationAgeGroupEnum.PRESCHOOL:
                mapping = {0: "FamilyFood", 1: "Mixed"}
            else:  # SCHOOL_AGE or anything else
                mapping = {0: "FamilyFood"}
            if ft is not None:
                label = mapping.get(int(ft))
        except Exception:
            label = None
        setattr(r, "feeding_type_label", label)

        # Vaccination status label (0=Up-to-date, 1=Partial, 2=Delayed)
        vs = r.vaccination_status
        vs_label = None
        try:
            vs_mapping = {0: "Up-to-date", 1: "Partial", 2: "Delayed"}
            if vs is not None:
                vs_label = vs_mapping.get(int(vs))
        except Exception:
            vs_label = None
        setattr(r, "vaccination_status_label", vs_label)

        # Nutrition flag label (0=Normal, 1=Nutrition risk)
        nf = r.nutrition_flag
        nf_label = None
        try:
            nf_mapping = {0: "Normal", 1: "Nutrition risk"}
            if nf is not None:
                nf_label = nf_mapping.get(int(nf))
        except Exception:
            nf_label = None
        setattr(r, "nutrition_flag_label", nf_label)

        masked.append(r)
    return masked


@router.get("/child/{child_id}/reports/{report_id}", response_model=ChildPredictionReportBase)
def get_prediction_report(
    child_id: int,
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    row: ChildPredictionReport | None = (
        db.query(ChildPredictionReport)
        .filter(
            ChildPredictionReport.child_id == child_id,
            ChildPredictionReport.id == report_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction report not found")
    age_months = None
    try:
        if row.age_months is not None:
            age_months = int(row.age_months)
        elif row.age_days is not None:
            age_months = int(row.age_days / 30.44)
    except Exception:
        age_months = None
    if age_months is not None and age_months < 6:
        try:
            setattr(row, "muac_cm", 0.0)
        except Exception:
            pass
    for attr in ("prob_fever", "prob_cold", "prob_diarrhea"):
        try:
            v = getattr(row, attr)
            if v is not None and float(v) < 0.5:
                setattr(row, attr, None)
        except (TypeError, ValueError):
            continue

    for attr in (
        "milestone_sit_delay_prob",
        "milestones_language_delay_prob",
        "milestones_walking_delay_prob",
        "milestone_speech_delay_prob",
        "milestone_social_play_delay_prob",
        "milestone_learning_delay_prob",
        "milestone_social_skill_delay_prob",
    ):
        try:
            v = getattr(row, attr)
            if v is not None and float(v) < 0.3:
                setattr(row, attr, None)
        except (TypeError, ValueError):
            continue

    # After masking, derive parent-friendly flags from the remaining probabilities
    _add_prediction_flags(row)

    # Feeding type label per age group
    ft = row.feeding_type
    ag = row.age_group
    label = None
    try:
        if ag == VaccinationAgeGroupEnum.INFANT:
            mapping = {0: "Breastmilk", 1: "Formula", 2: "Mixed"}
        elif ag == VaccinationAgeGroupEnum.TODDLER:
            mapping = {0: "FamilyFood", 1: "Mixed", 2: "Milk"}
        elif ag == VaccinationAgeGroupEnum.PRESCHOOL:
            mapping = {0: "FamilyFood", 1: "Mixed"}
        else:  # SCHOOL_AGE or anything else
            mapping = {0: "FamilyFood"}
        if ft is not None:
            label = mapping.get(int(ft))
    except Exception:
        label = None
    setattr(row, "feeding_type_label", label)

    # Vaccination status label (0=Up-to-date, 1=Partial, 2=Delayed)
    vs = row.vaccination_status
    vs_label = None
    try:
        vs_mapping = {0: "Up-to-date", 1: "Partial", 2: "Delayed"}
        if vs is not None:
            vs_label = vs_mapping.get(int(vs))
    except Exception:
        vs_label = None
    setattr(row, "vaccination_status_label", vs_label)

    # Nutrition flag label (0=Normal, 1=Nutrition risk)
    nf = row.nutrition_flag
    nf_label = None
    try:
        nf_mapping = {0: "Normal", 1: "Nutrition risk"}
        if nf is not None:
            nf_label = nf_mapping.get(int(nf))
    except Exception:
        nf_label = None
    setattr(row, "nutrition_flag_label", nf_label)

    return row


@router.get("/child/{child_id}/latest-report", response_model=ChildPredictionReportBase)
def get_latest_prediction_report_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    row: ChildPredictionReport | None = (
        db.query(ChildPredictionReport)
        .filter(ChildPredictionReport.child_id == child_id)
        .order_by(ChildPredictionReport.created_at.desc())
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction report not found")
    age_months = None
    try:
        if row.age_months is not None:
            age_months = int(row.age_months)
        elif row.age_days is not None:
            age_months = int(row.age_days / 30.44)
    except Exception:
        age_months = None
    if age_months is not None and age_months < 6:
        try:
            setattr(row, "muac_cm", 0.0)
        except Exception:
            pass
    for attr in ("prob_fever", "prob_cold", "prob_diarrhea"):
        try:
            v = getattr(row, attr)
            if v is not None and float(v) < 0.5:
                setattr(row, attr, None)
        except (TypeError, ValueError):
            continue

    for attr in (
        "milestone_sit_delay_prob",
        "milestones_language_delay_prob",
        "milestones_walking_delay_prob",
        "milestone_speech_delay_prob",
        "milestone_social_play_delay_prob",
        "milestone_learning_delay_prob",
        "milestone_social_skill_delay_prob",
    ):
        try:
            v = getattr(row, attr)
            if v is not None and float(v) < 0.3:
                setattr(row, attr, None)
        except (TypeError, ValueError):
            continue

    # After masking, derive parent-friendly flags from the remaining probabilities
    _add_prediction_flags(row)

    # Feeding type label per age group
    ft = row.feeding_type
    ag = row.age_group
    label = None
    try:
        if ag == VaccinationAgeGroupEnum.INFANT:
            mapping = {0: "Breastmilk", 1: "Formula", 2: "Mixed"}
        elif ag == VaccinationAgeGroupEnum.TODDLER:
            mapping = {0: "FamilyFood", 1: "Mixed", 2: "Milk"}
        elif ag == VaccinationAgeGroupEnum.PRESCHOOL:
            mapping = {0: "FamilyFood", 1: "Mixed"}
        else:  # SCHOOL_AGE or anything else
            mapping = {0: "FamilyFood"}
        if ft is not None:
            label = mapping.get(int(ft))
    except Exception:
        label = None
    setattr(row, "feeding_type_label", label)

    # Vaccination status label (0=Up-to-date, 1=Partial, 2=Delayed)
    vs = row.vaccination_status
    vs_label = None
    try:
        vs_mapping = {0: "Up-to-date", 1: "Partial", 2: "Delayed"}
        if vs is not None:
            vs_label = vs_mapping.get(int(vs))
    except Exception:
        vs_label = None
    setattr(row, "vaccination_status_label", vs_label)

    # Nutrition flag label (0=Normal, 1=Nutrition risk)
    nf = row.nutrition_flag
    nf_label = None
    try:
        nf_mapping = {0: "Normal", 1: "Nutrition risk"}
        if nf is not None:
            nf_label = nf_mapping.get(int(nf))
    except Exception:
        nf_label = None
    setattr(row, "nutrition_flag_label", nf_label)

    return row


@router.get("/child/{child_id}/trend", response_model=list[ChildPredictionTrendPoint])
def get_prediction_trend_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    # Order oldest->newest for charting
    rows: list[ChildPredictionReport] = (
        db.query(ChildPredictionReport)
        .filter(ChildPredictionReport.child_id == child_id)
        .order_by(ChildPredictionReport.created_at.asc())
        .all()
    )
    # Only expose fields needed for charts / growth trend
    points: list[ChildPredictionTrendPoint] = []
    for r in rows:
        points.append(
            ChildPredictionTrendPoint(
                id=r.id,
                created_at=r.created_at,
                age_group=r.age_group,
                age_days=r.age_days,
                age_months=r.age_months,
                age_years=r.age_years,
                weight_kg=r.weight_kg,
                height_cm=r.height_cm,
                bmi=r.bmi,
                growth_percentile=r.growth_percentile,
                nutrition_flag=r.nutrition_flag,
            )
        )
    return points





