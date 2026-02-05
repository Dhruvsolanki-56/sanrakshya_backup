import os
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from functools import lru_cache

from app.core.config import settings
from app.db import crud
from app.models.models import (
    Child,
    ChildAnthropometry as ChildAnthropometryModel,
    ChildIllnessLog as ChildIllnessLogModel,
    ChildMealLog as ChildMealLogModel,
    ChildVaccineStatus as ChildVaccineStatusModel,
    ChildMilestone as ChildMilestoneModel,
    ChildMilestoneStatus as ChildMilestoneStatusModel,
    VaccinationSchedule as VaccinationScheduleModel,
    FoodMaster as FoodMasterModel,
)
from app.schemas.schemas import VaccinationAgeGroupEnum, VaccineCategoryEnum, VaccineStatusEnum


# -------- Model cache --------
class _ModelCache:
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def get(self, path: str):
        if path in self._cache:
            return self._cache[path]
        if not os.path.exists(path):
            return None
        model = joblib.load(path)
        self._cache[path] = model
        return model


model_cache = _ModelCache()


# -------- Feature helpers --------

def clip_float(v: Optional[float], lo: float, hi: float) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(np.clip(v, lo, hi))
    except Exception:
        return None


def to_float(v: Optional[float]) -> Optional[float]:
    try:
        if v is None:
            return None
        return float(v)
    except Exception:
        return None


def age_fields(dob: date, as_of: date) -> Dict[str, int | float]:
    days = (as_of - dob).days
    months = days // 30
    years = days / 365.25
    return {"age_days": days, "age_months": months, "age_years": years}


def sex_to_int(gender: Optional[str]) -> int:
    if not gender:
        return 0
    g = gender.lower()
    if g.startswith("m"):
        return 0
    if g.startswith("f"):
        return 1
    return 1


def latest_anthro(db: Session, child_id: int) -> Optional[ChildAnthropometryModel]:
    return (
        db.query(ChildAnthropometryModel)
        .filter(ChildAnthropometryModel.child_id == child_id)
        .order_by(ChildAnthropometryModel.log_date.desc(), ChildAnthropometryModel.id.desc())
        .first()
    )


def trend_anthro(db: Session, child_id: int, months: int = 6) -> Tuple[Optional[float], Optional[float], int]:
    since = date.today() - timedelta(days=months * 30)
    rows = (
        db.query(ChildAnthropometryModel)
        .filter(
            ChildAnthropometryModel.child_id == child_id,
            ChildAnthropometryModel.log_date >= since,
        )
        .order_by(ChildAnthropometryModel.log_date.asc())
        .all()
    )
    if len(rows) < 2:
        return None, None, len(rows)
    w0, w1 = rows[0], rows[-1]
    days = (w1.log_date - w0.log_date).days or 1
    if to_float(w1.weight_kg) is None or to_float(w0.weight_kg) is None:
        return None, None, len(rows)
    avg_gain = (w1.weight_kg - w0.weight_kg) / max(days / 30.0, 0.01)
    vel = (w1.weight_kg - w0.weight_kg) / days
    return float(avg_gain), float(vel), len(rows)


def feeding_features(db: Session, child_id: int, group: VaccinationAgeGroupEnum, days_window: int = 7) -> Dict[str, int]:
    start = date.today() - timedelta(days=days_window)
    logs: List[ChildMealLogModel] = crud.list_child_meal_logs_between(db, child_id=child_id, start_date=start, end_date=date.today())
    items = 0
    # Category counters by group
    cnt: Dict[str, int] = {}
    for log in logs:
        for it in log.items or []:
            # Use recorded meal_frequency if present, otherwise fall back to 1
            freq = getattr(it, "meal_frequency", None)
            try:
                freq_val = int(freq) if freq is not None else 1
            except (TypeError, ValueError):
                freq_val = 1
            freq_val = max(freq_val, 1)
            items += freq_val

            name = (it.custom_food_name or "").lower()
            food_group = None
            food_name = None
            try:
                # Try to use joined relationship via eager load if present
                if hasattr(it, 'food') and it.food is not None:
                    food_group = getattr(it.food, 'food_group', None)
                    food_name = getattr(it.food, 'food_name', None)
            except Exception:
                food_group = None
                food_name = None

            # Fallback: if we still don't have metadata but have food_id, query FoodMaster
            if (food_group is None or food_name is None) and getattr(it, "food_id", None) is not None:
                try:
                    fm = (
                        db.query(FoodMasterModel)
                        .filter(FoodMasterModel.food_id == it.food_id)
                        .first()
                    )
                    if fm is not None:
                        if food_group is None:
                            food_group = getattr(fm, "food_group", None)
                        if food_name is None:
                            food_name = getattr(fm, "food_name", None)
                except Exception:
                    pass

            # Heuristics per age group
            if group == VaccinationAgeGroupEnum.INFANT:
                # Infant classes: 0=Breastmilk, 1=Formula, 2=Mixed
                is_breast = False
                is_formula = False

                # Normalize text fields for matching
                fg = str(food_group).lower() if food_group is not None else ""
                fname = (food_name or "").lower()

                # Heuristics:
                # - Any milk with "breast" keyword -> Breastmilk
                # - Any milk with "formula" keyword -> Formula
                # - Other plain milk defaults to Formula (bottle/packaged)
                # - Everything else (solids, cereals, etc.) -> Mixed
                if "breast" in fname or "breast" in name:
                    is_breast = True
                elif "formula" in fname or "formula" in name:
                    is_formula = True
                elif fg == "milk":
                    # Milk without explicit keyword -> treat as Formula by default
                    is_formula = True

                if is_breast:
                    cnt['Breastmilk'] = cnt.get('Breastmilk', 0) + freq_val
                elif is_formula:
                    cnt['Formula'] = cnt.get('Formula', 0) + freq_val
                else:
                    # Any other foods contribute to Mixed bucket
                    cnt['Mixed'] = cnt.get('Mixed', 0) + freq_val
            elif group == VaccinationAgeGroupEnum.TODDLER:
                # Toddler classes: 0=FamilyFood, 1=Mixed, 2=Milk
                if food_group and str(food_group).lower() == 'milk':
                    cnt['Milk'] = cnt.get('Milk', 0) + freq_val
                else:
                    cnt['FamilyFood'] = cnt.get('FamilyFood', 0) + freq_val
            elif group == VaccinationAgeGroupEnum.PRESCHOOL:
                # Preschool classes: FamilyFood, Mixed (we'll treat any non-exclusive as FamilyFood)
                cnt['FamilyFood'] = cnt.get('FamilyFood', 0) + freq_val
            else:
                # SchoolAge: FamilyFood
                cnt['FamilyFood'] = cnt.get('FamilyFood', 0) + freq_val
    feeding_frequency = int(np.clip(items // max(len(logs), 1), 1, 10)) if logs else 1
    # Majority mapping per group -> 0/1/2
    if group == VaccinationAgeGroupEnum.INFANT:
        # Order: 0=Breastmilk, 1=Formula, 2=Mixed
        # Determine mixed vs exclusive by counts
        b = cnt.get('Breastmilk', 0)
        f = cnt.get('Formula', 0)
        m = cnt.get('Mixed', 0)
        if b > max(f, m):
            feeding_type = 0
        elif f > max(b, m):
            feeding_type = 1
        else:
            feeding_type = 2
    elif group == VaccinationAgeGroupEnum.TODDLER:
        # Order: 0=FamilyFood, 1=Mixed, 2=Milk
        fam = cnt.get('FamilyFood', 0)
        milk = cnt.get('Milk', 0)
        # If both appear significantly, treat as Mixed
        if fam > 0 and milk > 0:
            # Mixed majority if roughly balanced
            ratio = milk / max(fam + milk, 1)
            if 0.3 < ratio < 0.7:
                feeding_type = 1
            else:
                feeding_type = 2 if ratio >= 0.7 else 0
        else:
            feeding_type = 0 if fam >= milk else 2
    elif group == VaccinationAgeGroupEnum.PRESCHOOL:
        # Order: 0=FamilyFood, 1=Mixed, 2=Other (unused)
        feeding_type = 0
    else:
        # SchoolAge: 0=FamilyFood
        feeding_type = 0
    return {"feeding_type": feeding_type, "feeding_frequency": feeding_frequency, "has_recent_meal_logs": int(bool(logs))}


def vaccination_status_code(db: Session, child: Child, group: VaccinationAgeGroupEnum) -> int:
    """Compute vaccination status from CORE vaccines with timing.
    Returns: 0=Up-to-date, 1=Partial, 2=Delayed
    Logic:
      - Delayed if any CORE dose is overdue (scheduled_date < today) and not COMPLETED.
      - Up-to-date if all CORE doses are COMPLETED and no overdue exists.
      - Partial otherwise (some completed, none overdue yet).
    """
    today = date.today()
    rows = (
        db.query(ChildVaccineStatusModel, VaccinationScheduleModel)
        .join(VaccinationScheduleModel, VaccinationScheduleModel.id == ChildVaccineStatusModel.schedule_id)
        .filter(
            ChildVaccineStatusModel.child_id == child.child_id,
            VaccinationScheduleModel.category == VaccineCategoryEnum.CORE,
        )
        .all()
    )
    if not rows:
        return 0
    total = len(rows)
    completed = 0
    delayed = 0   # missed or late
    pending = 0   # future due
    # Helper: parse recommended_age like "6 weeks", "9 months", "12-15 months", "2 years"
    def _parse_recommended_min_months(txt: Optional[str]) -> Optional[int]:
        if not txt:
            return None
        t = txt.strip().lower()
        # common tokens
        # ranges like "12-15 months" -> take 12
        import re
        # years
        m = re.search(r"(\d+)\s*years?", t)
        if m:
            return int(m.group(1)) * 12
        # months (with optional range)
        m = re.search(r"(\d+)(?:\s*[-–]\s*\d+)?\s*months?", t)
        if m:
            return int(m.group(1))
        # weeks -> convert to months approx (4.345 weeks per month ~ 4.3)
        m = re.search(r"(\d+)\s*weeks?", t)
        if m:
            w = int(m.group(1))
            return max(0, int(round(w / 4.345)))
        # days -> convert to months
        m = re.search(r"(\d+)\s*days?", t)
        if m:
            d = int(m.group(1))
            return max(0, int(round(d / 30.0)))
        # birth/newborn keywords -> 0
        if "birth" in t or "newborn" in t:
            return 0
        return None

    # compute child's current age in months (approx)
    try:
        age_months_now = int((date.today() - child.date_of_birth).days // 30)
    except Exception:
        age_months_now = None
    for (st, sch) in rows:
        if st.status == VaccineStatusEnum.COMPLETED:
            completed += 1
            # Late completion counts as delayed
            if st.scheduled_date is not None and st.actual_date is not None and st.actual_date > st.scheduled_date:
                delayed += 1
            # No scheduled_date: if schedule group < current group, consider late completion
            elif st.scheduled_date is None:
                # Approximate due from recommended_age
                min_m = _parse_recommended_min_months(getattr(sch, 'recommended_age', None)) if sch else None
                if min_m is not None and st.actual_date is not None:
                    due_date = child.date_of_birth + timedelta(days=int(min_m * 30))
                    if st.actual_date > due_date:
                        delayed += 1
                elif sch and getattr(sch, 'age_group', None) is not None and sch.age_group.value < group.value:
                    delayed += 1
            continue
        # Not completed; determine if due/overdue based on date or age group fallback
        if st.scheduled_date is not None:
            if st.scheduled_date < today:
                delayed += 1
            else:
                # today or future → pending
                pending += 1
        else:
            # No explicit scheduled date recorded: fall back to schedule age_group relative to child's current group
            min_m = _parse_recommended_min_months(getattr(sch, 'recommended_age', None)) if sch else None
            if min_m is not None and age_months_now is not None:
                if min_m < age_months_now:
                    delayed += 1
                else:
                    pending += 1
            elif sch and getattr(sch, 'age_group', None) is not None:
                if sch.age_group.value < group.value:
                    delayed += 1
                else:
                    pending += 1
            else:
                # Unknown schedule timing → treat as pending to be safe
                pending += 1
    # Final decision: prioritize delayed when significant
    if delayed > 1:
        return 2
    # If any pending or mix of completed/pending, mark partial
    if pending > 0 or (completed > 0 and completed < total):
        return 1
    # Otherwise up-to-date
    return 0


def illness_features(db: Session, child_id: int, days_window: int = 90) -> Dict[str, int | float]:
    since = date.today() - timedelta(days=days_window)
    rows: List[ChildIllnessLogModel] = (
        db.query(ChildIllnessLogModel)
        .filter(ChildIllnessLogModel.child_id == child_id, ChildIllnessLogModel.created_at >= since)
        .all()
    )
    fever = sum(1 for r in rows if r.fever)
    cold = sum(1 for r in rows if r.cold)
    diarrhea = sum(1 for r in rows if r.diarrhea)
    illness_trend = (len(rows) / max(days_window / 30.0, 1)) if rows else 0.0
    return {
        "illness_fever": fever,
        "illness_cold": cold,
        "illness_diarrhea": diarrhea,
        "illness_freq_trend": round(float(illness_trend), 3),
        "has_recent_illness_logs": int(bool(rows)),
    }


# -------- Validation and feature building per group --------

def required_fields_for_all(child: Child, db: Session) -> Tuple[List[str], Dict[str, Any]]:
    missing: List[str] = []
    base: Dict[str, Any] = {}

    if child.date_of_birth is None:
        missing.append("date_of_birth")
    if child.gender is None:
        missing.append("gender")

    anth = latest_anthro(db, child.child_id)
    if anth is None:
        missing.extend(["anthropometry.height_cm", "anthropometry.weight_kg"])
        anth_data = {}
    else:
        if anth.height_cm is None:
            missing.append("anthropometry.height_cm")
        if anth.weight_kg is None:
            missing.append("anthropometry.weight_kg")
        anth_data = {
            "weight_kg": to_float(anth.weight_kg),
            "height_cm": to_float(anth.height_cm),
            "muac_cm": to_float(anth.muac_cm),
            "sleep_hours": to_float(anth.avg_sleep_hours_per_day),
        }
        if anth.avg_sleep_hours_per_day is None:
            # recommended but not required
            pass
        if anth.muac_cm is None:
            pass

    base.update(anth_data)

    return missing, base


def build_features_for_group(db: Session, child: Child, group: VaccinationAgeGroupEnum) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    today = date.today()
    missing, base = required_fields_for_all(child, db)

    ages = age_fields(child.date_of_birth, today) if child.date_of_birth else {"age_days": None, "age_months": None, "age_years": None}
    avg_gain, vel, n_points = trend_anthro(db, child.child_id)
    feed = feeding_features(db, child.child_id, group)
    ill = illness_features(db, child.child_id)

    # new vs existing child
    is_existing = 1 if n_points >= 2 else 0

    # Shared base fields
    features: Dict[str, Any] = {
        "is_existing": is_existing,
        "sex": sex_to_int(child.gender),
        "avg_weight_gain": round(to_float(avg_gain) or 0.0, 3),
        "weight_velocity": round(to_float(vel) or 0.0, 3),
        "feeding_type": feed["feeding_type"],
        "feeding_frequency": feed["feeding_frequency"],
        "vaccination_status": vaccination_status_code(db, child, group),
        **ill,
    }
    features.update(base)

    # Age-group specific age column
    if group == VaccinationAgeGroupEnum.INFANT:
        features["age_days"] = ages["age_days"]
    elif group in (VaccinationAgeGroupEnum.TODDLER, VaccinationAgeGroupEnum.PRESCHOOL):
        features["age_months"] = ages["age_months"]
    else:
        features["age_years"] = int(np.floor(ages["age_years"])) if ages["age_years"] is not None else None

    # Derived optional fields present in training (BMI)
    if features.get("weight_kg") and features.get("height_cm"):
        h_m = features["height_cm"] / 100.0
        bmi_val = float(features["weight_kg"] / max(h_m * h_m, 1e-6))
        features["bmi"] = round(bmi_val, 3)
    else:
        features["bmi"] = 0.0
    # MUAC rule: estimate deterministically to align with training distribution
    # Training formula (without noise at inference):
    # muac = 10.5 + 0.25*weight_kg + 0.02*(height_cm - 60) + 0.3*sex, clipped to [9, 17]
    def _estimate_muac(sex_code: int, wt: Optional[float], ht: Optional[float]) -> Optional[float]:
        if wt is None or ht is None:
            return None
        base = 10.5 + 0.25 * float(wt) + 0.02 * (float(ht) - 60.0) + 0.3 * float(sex_code)
        return float(np.clip(base, 9.0, 17.0))
    # For infants under 6 months OR when muac missing, estimate using the formula
    m = ages.get("age_months")
    if (group == VaccinationAgeGroupEnum.INFANT and (m is not None and m < 6)) or features.get("muac_cm") is None:
        muac_est = _estimate_muac(features.get("sex", 0), features.get("weight_kg"), features.get("height_cm"))
        if muac_est is not None:
            features["muac_cm"] = round(muac_est, 3)
        else:
            # conservative low but valid fallback if anthropometry missing
            features["muac_cm"] = 9.5

    # WHO Z-scores (weight-for-age, height-for-age) using LMS tables if available
    w_z, h_z = compute_who_zscores(
        sex_code=features["sex"],
        age_days=ages.get("age_days"),
        age_months=ages.get("age_months"),
        weight_kg=features.get("weight_kg"),
        height_cm=features.get("height_cm"),
    )
    features["weight_zscore"] = round(w_z, 3)
    features["height_zscore"] = round(h_z, 3)

    # Milestone flags: 1 = archived (achieved_date present), 0 = not archived. Use DB linkage.
    milestone_map_by_group = {
        VaccinationAgeGroupEnum.INFANT: ["milestone_smile", "milestone_roll", "milestone_sit"],
        VaccinationAgeGroupEnum.TODDLER: ["milestones_language", "milestones_walking"],
        VaccinationAgeGroupEnum.PRESCHOOL: ["milestone_speech_clarity", "milestone_social_play"],
        VaccinationAgeGroupEnum.SCHOOL_AGE: ["milestone_learning_skill", "milestone_social_skill"],
    }
    expected_codes = milestone_map_by_group.get(group, [])
    milestone_flags: Dict[str, int] = {code: 0 for code in expected_codes}
    try:
        # Fetch milestones in current group
        group_milestones: List[ChildMilestoneModel] = (
            db.query(ChildMilestoneModel)
            .filter(ChildMilestoneModel.category == group)
            .all()
        )
        # Build mapping from expected feature code -> list of milestone IDs in DB
        def _norm(s: Optional[str]) -> str:
            return (s or "").strip().lower().replace(" ", "_")
        feature_to_ids: Dict[str, List[int]] = {code: [] for code in expected_codes}
        for m in group_milestones:
            code = (m.milestone_code or "").strip()
            code_l = code.lower()
            name_norm = _norm(m.milestone_name)
            subs = {_norm(getattr(m, f"sub_feature_{i}", None)) for i in range(1,4)}
            # direct exact code match to expected feature names
            if code in expected_codes:
                feature_to_ids[code].append(m.id)
                continue
            # exact match by normalized name or sub_features to expected code
            for feat in expected_codes:
                feat_norm = _norm(feat)
                if feat_norm == name_norm or feat_norm in subs or feat_norm == code_l:
                    feature_to_ids[feat].append(m.id)
                    break
            else:
                # keyword heuristics
                keywords = {
                    "milestone_smile": ["smile"],
                    "milestone_roll": ["roll"],
                    "milestone_sit": ["sit"],
                    "milestones_language": ["language"],
                    "milestones_walking": ["walk"],
                    "milestone_speech_clarity": ["speech", "clarity"],
                    "milestone_social_play": ["social", "play"],
                    "milestone_learning_skill": ["learning"],
                    "milestone_social_skill": ["social", "skill"],
                }
                for feat, keys in keywords.items():
                    if feat in expected_codes and all(k in name_norm for k in keys):
                        feature_to_ids[feat].append(m.id)
                        break
        # Fetch all statuses for this child once
        status_rows: List[ChildMilestoneStatusModel] = (
            db.query(ChildMilestoneStatusModel)
            .filter(ChildMilestoneStatusModel.child_id == child.child_id)
            .all()
        )
        # Consider any status row as archived presence per your app's semantics
        achieved_ids = {r.milestone_id for r in status_rows}
        # Assign flags per expected feature
        for feat in expected_codes:
            ids = feature_to_ids.get(feat, [])
            milestone_flags[feat] = 1 if any(mid in achieved_ids for mid in ids) else 0
    except Exception:
        pass
    features.update(milestone_flags)

    # Presence hints (not fed into model unless needed by feature names)
    presence = {
        "has_recent_meal_logs": feed["has_recent_meal_logs"],
        "has_recent_illness_logs": ill["has_recent_illness_logs"],
    }

    # Check if any vaccination data exists for this child
    try:
        has_vaccine_data = bool(
            db.query(ChildVaccineStatusModel)
            .filter(ChildVaccineStatusModel.child_id == child.child_id)
            .first()
        )
    except Exception:
        has_vaccine_data = False

    # Check if any milestone status data exists for this child
    try:
        has_milestone_data = bool(
            db.query(ChildMilestoneStatusModel)
            .filter(ChildMilestoneStatusModel.child_id == child.child_id)
            .first()
        )
    except Exception:
        has_milestone_data = False

    # Required missing gating rule:
    # - core demographics/anthropometry
    # - at least one meal log in the last 7 days
    # - at least one illness log in the last 90 days
    # - vaccination data recorded
    # - milestone status recorded
    # - avg_sleep_hours_per_day present
    required_missing = missing
    if not presence["has_recent_meal_logs"]:
        required_missing.append("meal_logs_last_7_days")
    if not presence["has_recent_illness_logs"]:
        required_missing.append("illness_logs_last_90_days")
    if not has_vaccine_data:
        required_missing.append("vaccination.core_status")
    if not has_milestone_data:
        required_missing.append("milestones.current_group_status")
    if features.get("sleep_hours") is None:
        required_missing.append("anthropometry.avg_sleep_hours_per_day")



    # Normalize None age fields to 0 for model compatibility
    for k in ("age_days", "age_months", "age_years"):
        if features.get(k) is None:
            features[k] = 0

    return features, {
        "required_missing": required_missing,
        "age_group": group.value,
        "is_existing": bool(is_existing),
    }


def dataframe_for_model(features: Dict[str, Any], expected_columns: List[str]) -> pd.DataFrame:
    # Build a single-row DataFrame with all expected columns in order, fill None/NaN with 0
    row = {c: (0 if features.get(c) is None or (isinstance(features.get(c), float) and np.isnan(features.get(c))) else features.get(c)) for c in expected_columns}
    df = pd.DataFrame([row])
    df = df.fillna(0)
    return df


# -------- WHO/CDC LMS utilities --------

@lru_cache(maxsize=1)
def _load_lms_sources() -> Dict[str, pd.DataFrame]:
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "who_lms")
    paths = {
        "who_wfa_boys": os.path.join(base_dir, "who_wfa_boys_0_24.csv"),
        "who_wfa_girls": os.path.join(base_dir, "who_wfa_girls_0_24.csv"),
        "who_lfa_boys": os.path.join(base_dir, "who_lfa_boys_0_24.csv"),
        "who_lfa_girls": os.path.join(base_dir, "who_lfa_girls_0_24.csv"),
        "cdc_wfa": os.path.join(base_dir, "cdc_wfa_2_20.csv"),
        "cdc_hfa": os.path.join(base_dir, "cdc_hfa_2_20.csv"),
    }
    out: Dict[str, pd.DataFrame] = {}
    for k, p in paths.items():
        if not os.path.exists(p):
            out[k] = pd.DataFrame()
        else:
            df = pd.read_csv(p)
            out[k] = df
    # Normalize WHO per-sex files
    def _norm_who(df: pd.DataFrame, sex: int) -> pd.DataFrame:
        if df.empty:
            return df
        cols = {"Month": "Agemos", "L": "L", "M": "M", "S": "S"}
        df2 = df[list(cols.keys())].rename(columns=cols).copy()
        df2["Sex"] = sex
        df2["Agemos"] = df2["Agemos"].astype(float)
        return df2[["Sex", "Agemos", "L", "M", "S"]]
    who_wfa = pd.concat([
        _norm_who(out["who_wfa_boys"], 1),
        _norm_who(out["who_wfa_girls"], 2),
    ], ignore_index=True) if not out["who_wfa_boys"].empty or not out["who_wfa_girls"].empty else pd.DataFrame(columns=["Sex","Agemos","L","M","S"])
    who_lfa = pd.concat([
        _norm_who(out["who_lfa_boys"], 1),
        _norm_who(out["who_lfa_girls"], 2),
    ], ignore_index=True) if not out["who_lfa_boys"].empty or not out["who_lfa_girls"].empty else pd.DataFrame(columns=["Sex","Agemos","L","M","S"])
    # Normalize CDC files
    def _norm_cdc(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        cols = {"Sex": "Sex", "Agemos": "Agemos", "L": "L", "M": "M", "S": "S"}
        df2 = df[list(cols.keys())].rename(columns=cols).copy()
        df2["Agemos"] = df2["Agemos"].astype(float)
        return df2[["Sex", "Agemos", "L", "M", "S"]]
    cdc_wfa = _norm_cdc(out["cdc_wfa"]) if not out["cdc_wfa"].empty else pd.DataFrame(columns=["Sex","Agemos","L","M","S"])
    cdc_hfa = _norm_cdc(out["cdc_hfa"]) if not out["cdc_hfa"].empty else pd.DataFrame(columns=["Sex","Agemos","L","M","S"])
    return {
        "who_wfa": who_wfa.sort_values(["Sex", "Agemos"]).reset_index(drop=True),
        "who_lfa": who_lfa.sort_values(["Sex", "Agemos"]).reset_index(drop=True),
        "cdc_wfa": cdc_wfa.sort_values(["Sex", "Agemos"]).reset_index(drop=True),
        "cdc_hfa": cdc_hfa.sort_values(["Sex", "Agemos"]).reset_index(drop=True),
    }


def _interp_lms(df: pd.DataFrame, sex: int, agemos: float) -> Optional[Tuple[float, float, float]]:
    if df.empty or not np.isfinite(agemos):
        return None
    sub = df[df["Sex"] == sex]
    if sub.empty:
        return None
    if agemos <= sub["Agemos"].min():
        r = sub.iloc[sub["Agemos"].argmin()]
        return float(r["L"]), float(r["M"]), float(r["S"])
    if agemos >= sub["Agemos"].max():
        r = sub.iloc[sub["Agemos"].argmax()]
        return float(r["L"]), float(r["M"]), float(r["S"])
    lo = sub[sub["Agemos"] <= agemos].iloc[-1]
    hi = sub[sub["Agemos"] >= agemos].iloc[0]
    if float(hi["Agemos"]) == float(lo["Agemos"]):
        return float(lo["L"]), float(lo["M"]), float(lo["S"])
    t = (agemos - float(lo["Agemos"])) / (float(hi["Agemos"]) - float(lo["Agemos"]))
    L = float(lo["L"]) + t * (float(hi["L"]) - float(lo["L"]))
    M = float(lo["M"]) + t * (float(hi["M"]) - float(lo["M"]))
    S = float(lo["S"]) + t * (float(hi["S"]) - float(lo["S"]))
    return L, M, S


def _z_from_lms(x: Optional[float], L: float, M: float, S: float) -> Optional[float]:
    if x is None or not np.isfinite(x) or M <= 0 or S <= 0:
        return None
    if L == 0:
        return float(np.log(x / M) / S)
    return float(((x / M) ** L - 1.0) / (L * S))


def compute_who_zscores(
    sex_code: int,
    age_days: Optional[int],
    age_months: Optional[int | float],
    weight_kg: Optional[float],
    height_cm: Optional[float],
) -> Tuple[float, float]:
    try:
        sex = 1 if sex_code == 0 else 2
        if age_months is not None:
            agemos = float(age_months)
        elif age_days is not None:
            agemos = float(age_days) / 30.0
        else:
            return 0.0, 0.0
        src = _load_lms_sources()
        if agemos < 24.0:
            w_lms = _interp_lms(src["who_wfa"], sex, agemos)
            h_lms = _interp_lms(src["who_lfa"], sex, agemos)
        else:
            w_lms = _interp_lms(src["cdc_wfa"], sex, agemos)
            h_lms = _interp_lms(src["cdc_hfa"], sex, agemos)
        wz = _z_from_lms(weight_kg, *w_lms) if w_lms else None
        hz = _z_from_lms(height_cm, *h_lms) if h_lms else None
        return float(wz) if wz is not None and np.isfinite(wz) else 0.0, float(hz) if hz is not None and np.isfinite(hz) else 0.0
    except Exception:
        return 0.0, 0.0
