from datetime import date, timedelta
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session

from app.models.models import (
    Child,
    ChildVaccineStatus as ChildVaccineStatusModel,
    VaccinationSchedule as VaccinationScheduleModel,
    ChildPredictionReport as ChildPredictionReportModel,
    ChildIllnessLog as ChildIllnessLogModel,
    ChildMilestoneStatus as ChildMilestoneStatusModel,
    ChildMilestone as ChildMilestoneModel,
)
from app.schemas.schemas import VaccineStatusEnum, VaccineCategoryEnum, VaccinationAgeGroupEnum
from app.services.prediction_common import latest_anthro, compute_who_zscores, trend_anthro, sex_to_int
from app.db.crud_nutrition import get_child_weekly_nutrition_summary
from app.db.crud import compute_child_age_group


def _classify_wfa(z: Optional[float]) -> str:
    try:
        if z is None:
            return "Normal"
        z = float(z)
    except (TypeError, ValueError):
        return "Normal"
    if z < -2:
        return "Underweight"
    if z > 2:
        return "Overweight"
    return "Normal"


def _classify_hfa(z: Optional[float]) -> str:
    try:
        if z is None:
            return "Normal"
        z = float(z)
    except (TypeError, ValueError):
        return "Normal"
    if z < -2:
        return "Stunted"
    return "Normal"


def _trend_arrow(avg_gain: Optional[float]) -> str:
    try:
        if avg_gain is None:
            return "Stable"
        g = float(avg_gain)
    except (TypeError, ValueError):
        return "Stable"
    if g >= 0.1:
        return "Improving"
    if g <= -0.05:
        return "Declining"
    return "Stable"


def _age_ym(dob: date, as_of: date) -> Dict[str, int]:
    days = (as_of - dob).days
    years = days // 365
    months = (days % 365) // 30
    return {"years": int(years), "months": int(months)}


def _parse_recommended_min_months(txt: Optional[str]) -> Optional[int]:
    if not txt:
        return None
    t = txt.strip().lower()
    import re
    m = re.search(r"(\d+)\s*years?", t)
    if m:
        return int(m.group(1)) * 12
    m = re.search(r"(\d+)(?:\s*[-–]\s*\d+)?\s*months?", t)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+)\s*weeks?", t)
    if m:
        w = int(m.group(1))
        return max(0, int(round(w / 4.345)))
    m = re.search(r"(\d+)\s*days?", t)
    if m:
        d = int(m.group(1))
        return max(0, int(round(d / 30.0)))
    if "birth" in t or "newborn" in t:
        return 0
    return None


def _vaccination_summary(db: Session, child: Child) -> Dict[str, Any]:
    today = date.today()
    # Determine child's current vaccination age group
    group = compute_child_age_group(child.date_of_birth)
    # Fetch CORE schedules only for this age group and any existing status rows for this child
    schedules: List[VaccinationScheduleModel] = (
        db.query(VaccinationScheduleModel)
        .filter(
            VaccinationScheduleModel.category == VaccineCategoryEnum.CORE,
            VaccinationScheduleModel.age_group == group,
        )
        .order_by(VaccinationScheduleModel.id.asc())
        .all()
    )
    status_rows: List[ChildVaccineStatusModel] = (
        db.query(ChildVaccineStatusModel)
        .filter(ChildVaccineStatusModel.child_id == child.child_id)
        .all()
    )
    # Map (schedule_id, dose_number) -> status row for quick lookup
    status_map: Dict[tuple[int, int], ChildVaccineStatusModel] = {}
    for st in status_rows:
        try:
            key = (int(getattr(st, "schedule_id")), int(getattr(st, "dose_number")))
            status_map[key] = st
        except Exception:
            continue
    missed = 0
    next_due_date: Optional[date] = None
    next_due_name: Optional[str] = None
    next_due_recommended_age: Optional[str] = None
    def _parse_due_date(age_text: Optional[str], dose_number: int, dob: date) -> Optional[date]:
        if not age_text:
            return None
        txt = age_text.replace('\u2013', '-').replace('\u2014', '-').replace('\u2212', '-').replace('\u2011', '-').replace('\u00A0', ' ')
        txt = txt.lower()
        import re
        m_list = re.findall(r"(\d+)\s*,?", txt)
        unit = None
        if 'week' in txt:
            unit = 'week'
        elif 'month' in txt:
            unit = 'month'
        elif 'year' in txt:
            unit = 'year'
        if 'at birth' in txt:
            return dob
        m_range = re.search(r"(\d+)\s*[-]\s*(\d+)", txt)
        if m_range and unit:
            upper = int(m_range.group(2))
            if unit == 'week':
                return dob + timedelta(days=upper * 7)
            if unit == 'month':
                return dob + timedelta(days=upper * 30)
            if unit == 'year':
                return dob + timedelta(days=upper * 365)
        if m_list and unit:
            idx = max(0, min(len(m_list) - 1, dose_number - 1))
            val = int(m_list[idx])
            if unit == 'week':
                return dob + timedelta(days=val * 7)
            if unit == 'month':
                return dob + timedelta(days=val * 30)
            if unit == 'year':
                return dob + timedelta(days=val * 365)
        m_single = re.search(r"(\d+)", txt)
        if m_single and unit:
            val = int(m_single.group(1))
            if unit == 'week':
                return dob + timedelta(days=val * 7)
            if unit == 'month':
                return dob + timedelta(days=val * 30)
            if unit == 'year':
                return dob + timedelta(days=val * 365)
        if 'every year' in txt:
            return dob + timedelta(days=365)
        if 'every 6 months' in txt:
            if '9 months' in txt:
                return dob + timedelta(days=9 * 30)
            return dob + timedelta(days=6 * 30)
        return None
    # Walk through each core schedule and each required dose in CURRENT age group to find missed and next due
    for sch in schedules:
        total = getattr(sch, "doses_required", None) or 1
        try:
            total_int = int(total)
        except (TypeError, ValueError):
            total_int = 1
        for dose_number in range(1, total_int + 1):
            st = status_map.get((sch.id, dose_number))
            # Treat any row with actual_date or COMPLETED status as completed
            if st is not None:
                st_status = getattr(st, "status", None)
                st_actual = getattr(st, "actual_date", None)
                if st_actual is not None or st_status == VaccineStatusEnum.COMPLETED:
                    continue
            # Not completed: compute due date from explicit scheduled_date or schedule text
            if st is not None and getattr(st, "scheduled_date", None) is not None:
                due = getattr(st, "scheduled_date")
            else:
                age_text = getattr(sch, 'recommended_age', None)
                due = _parse_due_date(age_text, dose_number, child.date_of_birth) if age_text is not None else None
            if due is None:
                continue
            # Count overdue doses as missed for CURRENT age group
            if due < today:
                missed += 1
                # Do not propose already-missed doses as next vaccine
                continue
            # For upcoming doses (due today or later), track the earliest as the next vaccine to take
            if next_due_date is None or due < next_due_date:
                next_due_date = due
                next_due_name = sch.vaccine_name
                next_due_recommended_age = getattr(sch, "recommended_age", None)
    # If no upcoming dose in the current age group,
    # look ahead to the NEXT age group for the next vaccine.
    if next_due_date is None:
        next_group = None
        try:
            order = [
                VaccinationAgeGroupEnum.INFANT,
                VaccinationAgeGroupEnum.TODDLER,
                VaccinationAgeGroupEnum.PRESCHOOL,
                VaccinationAgeGroupEnum.SCHOOL_AGE,
            ]
            if group in order:
                idx = order.index(group)
                if idx + 1 < len(order):
                    next_group = order[idx + 1]
        except Exception:
            next_group = None
        if next_group is not None:
            next_schedules: List[VaccinationScheduleModel] = (
                db.query(VaccinationScheduleModel)
                .filter(
                    VaccinationScheduleModel.category == VaccineCategoryEnum.CORE,
                    VaccinationScheduleModel.age_group == next_group,
                )
                .order_by(VaccinationScheduleModel.id.asc())
                .all()
            )
            for sch in next_schedules:
                total = getattr(sch, "doses_required", None) or 1
                try:
                    total_int = int(total)
                except (TypeError, ValueError):
                    total_int = 1
                for dose_number in range(1, total_int + 1):
                    st = status_map.get((sch.id, dose_number))
                    # Treat any row with actual_date or COMPLETED status as completed
                    if st is not None:
                        st_status = getattr(st, "status", None)
                        st_actual = getattr(st, "actual_date", None)
                        if st_actual is not None or st_status == VaccineStatusEnum.COMPLETED:
                            continue
                    # Not completed: compute due date from explicit scheduled_date or schedule text
                    if st is not None and getattr(st, "scheduled_date", None) is not None:
                        due = getattr(st, "scheduled_date")
                    else:
                        age_text = getattr(sch, 'recommended_age', None)
                        due = _parse_due_date(age_text, dose_number, child.date_of_birth) if age_text is not None else None
                    if due is None:
                        continue
                    # For next age group we only care about upcoming doses (do not affect missed_count)
                    if due < today:
                        continue
                    if next_due_date is None or due < next_due_date:
                        next_due_date = due
                        next_due_name = sch.vaccine_name
                        next_due_recommended_age = getattr(sch, "recommended_age", None)
    # Derive status while always returning next due details when available
    if missed > 0:
        status = "Missed"
    elif next_due_date is not None:
        status = "Upcoming"
    else:
        status = "Up-to-date"
    return {
        "status": status,
        "next_due_name": next_due_name,
        "next_due_recommended_age": next_due_recommended_age,
        "next_due_date": next_due_date,
        "missed_count": missed,
    }


def _milestone_delays_from_predictions(db: Session, child_id: int) -> List[str]:
    # Only use milestones present in DB (existing status records). If none, return no delays.
    has_status = (
        db.query(ChildMilestoneStatusModel)
        .filter(ChildMilestoneStatusModel.child_id == child_id)
        .first()
    )
    if not has_status:
        return []
    row: Optional[ChildPredictionReportModel] = (
        db.query(ChildPredictionReportModel)
        .filter(ChildPredictionReportModel.child_id == child_id)
        .order_by(ChildPredictionReportModel.created_at.desc())
        .first()
    )
    if not row:
        return []
    def _val(v: Optional[float]) -> Optional[float]:
        try:
            if v is None:
                return None
            f = float(v)
            return f
        except (TypeError, ValueError):
            return None
    def _is_delay(prob: Optional[float]) -> bool:
        p = _val(prob)
        if p is None:
            return False
        return p >= 0.6
    # Map expected feature codes per age group to exact milestone names
    try:
        group = getattr(row, "age_group", None)
        # Features by group (aligned with prediction feature set)
        feature_by_group = {
            # Infant
            getattr(group, "INFANT", None): ["milestone_smile", "milestone_roll", "milestone_sit"],
            # Toddler
            getattr(group, "TODDLER", None): ["milestones_language", "milestones_walking"],
            # Preschool
            getattr(group, "PRESCHOOL", None): ["milestone_speech_clarity", "milestone_social_play"],
            # School age
            getattr(group, "SCHOOL_AGE", None): ["milestone_learning_skill", "milestone_social_skill"],
        }
        # Fallback if enum comparison above doesn't match: derive by value
        expected = None
        for k, v in feature_by_group.items():
            if k is not None and k == group:
                expected = v
                break
        if expected is None:
            # generic fallback: include all known features
            expected = [
                "milestone_smile", "milestone_roll", "milestone_sit",
                "milestones_language", "milestones_walking",
                "milestone_speech_clarity", "milestone_social_play",
                "milestone_learning_skill", "milestone_social_skill",
            ]
        # Build mapping feature -> milestone names from DB by category
        def _norm(s: Optional[str]) -> str:
            return (s or "").strip().lower().replace(" ", "_")
        names_by_feat: Dict[str, List[str]] = {f: [] for f in expected}
        group_milestones = (
            db.query(ChildMilestoneModel)
            .filter(ChildMilestoneModel.category == group)
            .all()
        )
        for m in group_milestones:
            code = (getattr(m, "milestone_code", None) or "").strip()
            name = getattr(m, "milestone_name", None)
            name_norm = _norm(name)
            subs = {_norm(getattr(m, f"sub_feature_{i}", None)) for i in range(1,4)}
            if code in expected:
                if name:
                    names_by_feat[code].append(name)
                continue
            for feat in expected:
                fn = _norm(feat)
                if fn == name_norm or fn in subs or fn == code.lower():
                    if name:
                        names_by_feat[feat].append(name)
                    break
        # Determine delayed features from report
        delayed_feats = []
        if _is_delay(getattr(row, "milestone_sit_delay_prob", None)):
            delayed_feats.append("milestone_sit")
        if _is_delay(getattr(row, "milestones_language_delay_prob", None)):
            delayed_feats.append("milestones_language")
        if _is_delay(getattr(row, "milestones_walking_delay_prob", None)):
            delayed_feats.append("milestones_walking")
        if _is_delay(getattr(row, "milestone_speech_delay_prob", None)):
            delayed_feats.append("milestone_speech_clarity")
        if _is_delay(getattr(row, "milestone_social_play_delay_prob", None)):
            delayed_feats.append("milestone_social_play")
        if _is_delay(getattr(row, "milestone_learning_delay_prob", None)):
            delayed_feats.append("milestone_learning_skill")
        if _is_delay(getattr(row, "milestone_social_skill_delay_prob", None)):
            delayed_feats.append("milestone_social_skill")
        # Collect exact names (deduplicated)
        out: List[str] = []
        seen = set()
        for f in delayed_feats:
            for nm in names_by_feat.get(f, []):
                if nm and nm not in seen:
                    out.append(nm)
                    seen.add(nm)
        return out
    except Exception:
        return []


def _illness_flag_info(p: Optional[float]) -> Optional[dict]:
    try:
        if p is None:
            return None
        p = float(p)
    except (TypeError, ValueError):
        return None
    if p < 0.5:
        return None
    if p < 0.6:
        severity = "Mild"
        msg = "Possible in next few days"
    elif p < 0.8:
        severity = "Moderate"
        msg = "Likely in next few days"
    else:
        severity = "High"
        msg = "Very likely in next few days"
    return {"severity": severity, "probability": round(p, 3), "risk_window_days": 7, "message": msg}


def _illness_flags_from_latest_report(db: Session, child_id: int) -> Dict[str, dict]:
    """Return structured illness risk flags using latest AI report, masking probs < 0.5 like AI screen."""
    row: Optional[ChildPredictionReportModel] = (
        db.query(ChildPredictionReportModel)
        .filter(ChildPredictionReportModel.child_id == child_id)
        .order_by(ChildPredictionReportModel.created_at.desc())
        .first()
    )
    out: Dict[str, dict] = {}
    if not row:
        return out
    probs = {
        "fever": getattr(row, "prob_fever", None),
        "cold": getattr(row, "prob_cold", None),
        "diarrhea": getattr(row, "prob_diarrhea", None),
    }
    for k, v in probs.items():
        info = _illness_flag_info(v)
        if info:
            out[k] = info
    return out


def _nutrition_deficiency(db: Session, child_id: int) -> Dict[str, Any]:
    summ = get_child_weekly_nutrition_summary(db, child_id=child_id, week_start=None)
    needed = summ.get("needed_nutrients") or []
    allowed = {
        "protein_g": "Protein",
        "energy_kcal": "Energy",
        "iron_mg": "Iron",
        "calcium_mg": "Calcium",
    }
    major: Optional[str] = None
    for k in needed:
        if k in allowed:
            major = allowed[k]
            break
    percent = summ.get("percent_of_requirement") or {}
    return {"major": major, "percent": percent}


def _compute_risk(w_z: Optional[float], h_z: Optional[float], avg_gain: Optional[float], missed_vaccines: int, deficiency_major: Optional[str], percent: Dict[str, Any], next_due_date: Optional[date]) -> Dict[str, Any]:
    reasons: List[str] = []
    try:
        wz = float(w_z) if w_z is not None else 0.0
    except (TypeError, ValueError):
        wz = 0.0
    try:
        hz = float(h_z) if h_z is not None else 0.0
    except (TypeError, ValueError):
        hz = 0.0
    try:
        g = float(avg_gain) if avg_gain is not None else 0.0
    except (TypeError, ValueError):
        g = 0.0
    try:
        energy_pct = float(percent.get("energy_kcal", 0.0) or 0.0)
    except Exception:
        energy_pct = 0.0
    high = False
    if wz <= -3.0 or hz <= -3.0:
        reasons.append("severe_undernutrition")
        high = True
    if g < 0:
        reasons.append("growth_faltering")
        high = True
    if missed_vaccines >= 2:
        reasons.append("multiple_missed_vaccines")
        high = True
    if deficiency_major in {"Energy", "Protein"} and energy_pct < 60.0:
        if deficiency_major == "Energy":
            reasons.append("severe_dietary_deficit_energy")
        elif deficiency_major == "Protein":
            reasons.append("severe_dietary_deficit_protein")
        else:
            reasons.append("severe_dietary_deficit")
        high = True
    if high:
        return {"level": "Red", "reasons": reasons}
    medium_reasons: List[str] = []
    if (-3.0 < wz <= -2.0) or (-3.0 < hz <= -2.0):
        medium_reasons.append("borderline_growth")
    if missed_vaccines == 1:
        medium_reasons.append("missed_vaccine")
    soon = False
    if next_due_date is not None:
        delta = (next_due_date - date.today()).days
        if 0 <= delta <= 14:
            soon = True
    if soon:
        medium_reasons.append("upcoming_vaccine_due_soon")
    if deficiency_major is not None and deficiency_major not in {"Energy", "Protein"}:
        code = f"nutrient_deficit_{str(deficiency_major).lower()}"
        medium_reasons.append(code)
    if medium_reasons:
        return {"level": "Yellow", "reasons": medium_reasons}
    return {"level": "Green", "reasons": []}


def _timeline(db: Session, child: Child) -> Dict[str, Any]:
    # Last vaccination (actual_date of COMPLETED)
    last_vac = (
        db.query(ChildVaccineStatusModel)
        .filter(
            ChildVaccineStatusModel.child_id == child.child_id,
            ChildVaccineStatusModel.status == VaccineStatusEnum.COMPLETED,
            ChildVaccineStatusModel.actual_date.isnot(None),
        )
        .order_by(ChildVaccineStatusModel.actual_date.desc())
        .first()
    )
    # Last illness
    last_ill = (
        db.query(ChildIllnessLogModel)
        .filter(ChildIllnessLogModel.child_id == child.child_id)
        .order_by(ChildIllnessLogModel.created_at.desc())
        .first()
    )
    # Last AI report
    last_ai = (
        db.query(ChildPredictionReportModel)
        .filter(ChildPredictionReportModel.child_id == child.child_id)
        .order_by(ChildPredictionReportModel.created_at.desc())
        .first()
    )
    return {
        "last_vaccination": getattr(last_vac, "actual_date", None) if last_vac else None,
        "last_illness": getattr(last_ill, "created_at", None) if last_ill else None,
        "last_ai_report": getattr(last_ai, "created_at", None) if last_ai else None,
    }


def get_child_profile_summary(db: Session, *, child_id: int) -> Dict[str, Any]:
    child: Optional[Child] = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        raise ValueError("Child not found")
    today = date.today()
    age = _age_ym(child.date_of_birth, today)
    anth = latest_anthro(db, child.child_id)
    weight_kg = getattr(anth, "weight_kg", None) if anth else None
    height_cm = getattr(anth, "height_cm", None) if anth else None
    age_days = (today - child.date_of_birth).days
    age_months = age_days // 30
    sex_code = sex_to_int(child.gender)
    # Prefer latest AI report values when available
    pred: Optional[ChildPredictionReportModel] = (
        db.query(ChildPredictionReportModel)
        .filter(ChildPredictionReportModel.child_id == child.child_id)
        .order_by(ChildPredictionReportModel.created_at.desc())
        .first()
    )
    if pred and getattr(pred, "weight_zscore", None) is not None and getattr(pred, "height_zscore", None) is not None:
        w_z = float(getattr(pred, "weight_zscore"))
        h_z = float(getattr(pred, "height_zscore"))
        wfa = _classify_wfa(w_z)
        hfa = _classify_hfa(h_z)
    else:
        w_z = None
        h_z = None
        wfa = None
        hfa = None
    if pred and getattr(pred, "avg_weight_gain", None) is not None:
        trend = _trend_arrow(getattr(pred, "avg_weight_gain"))
    else:
        avg_gain, vel, n_points = trend_anthro(db, child.child_id)
        trend = _trend_arrow(avg_gain)
    nut = _nutrition_deficiency(db, child.child_id)
    major_def = nut.get("major")
    percent = nut.get("percent") or {}
    vac = _vaccination_summary(db, child)
    # Override vaccination status with latest AI report when available
    ai_vac_status = getattr(pred, "vaccination_status", None) if pred else None
    if ai_vac_status is not None:
        try:
            ai_vac_code = int(ai_vac_status)
        except (TypeError, ValueError):
            ai_vac_code = None
        if ai_vac_code is not None:
            status_map = {0: "Up-to-date", 1: "Partial", 2: "Delayed"}
            label = status_map.get(ai_vac_code)
            if label is not None:
                vac["status"] = label
    missed_count = int(vac.get("missed_count") or 0)
    delays = _milestone_delays_from_predictions(db, child.child_id)
    age_appropriate = len(delays) == 0
    ai_percentile = getattr(pred, "growth_percentile", None) if pred else None
    nf = getattr(pred, "nutrition_flag", None) if pred else None
    nutrition_status = None
    if nf is not None:
        try:
            nutrition_status = {0: "Normal", 1: "Nutrition risk"}.get(int(nf))
        except Exception:
            nutrition_status = None
    # Compute risk (single object) with reason codes
    # avg_gain variable may be undefined if pred supplied trend; compute safe avg_gain for risk
    try:
        avg_gain_for_risk = float(getattr(pred, "avg_weight_gain")) if pred and getattr(pred, "avg_weight_gain", None) is not None else None
    except Exception:
        avg_gain_for_risk = None
    if avg_gain_for_risk is None:
        ag, _, _ = trend_anthro(db, child.child_id)
        avg_gain_for_risk = ag
    next_due_date_for_risk = vac.get("next_due_date")
    risk = _compute_risk(w_z, h_z, avg_gain_for_risk, missed_count, major_def, percent, next_due_date_for_risk)
    illness_flags = _illness_flags_from_latest_report(db, child.child_id)
    tl = _timeline(db, child)
    return {
        "child_id": child.child_id,
        "name": child.full_name,
        "age": age,
        "gender": child.gender,
        "blood_group": child.blood_group,
        "risk": risk,
        "growth_summary": {
            "weight_for_age": wfa,
            "height_for_age": hfa,
            "trend": trend,
        },
        "major_deficiency": major_def,
        "vaccination": {
            "status": vac.get("status"),
            "next_due_name": vac.get("next_due_name"),
            "next_due_recommended_age": vac.get("next_due_recommended_age"),
            "missed_count": missed_count,
        },
        "milestones": {
            "age_appropriate": age_appropriate,
            "delays": delays,
        },
        "ai_percentile": ai_percentile,
        "nutrition_status": nutrition_status,
        "illness_flags": illness_flags,
        "timeline": tl,
    }
