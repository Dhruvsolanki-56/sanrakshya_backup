from datetime import date
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.models import (
    Child as ChildModel,
    ChildAnthropometry as ChildAnthropometryModel,
    ChildIllnessLog as ChildIllnessLogModel,
)
from app.db import crud, crud_nutrition


def _age_fields(dob: date, as_of: Optional[date] = None) -> Dict[str, Any]:
    if as_of is None:
        as_of = date.today()
    days = (as_of - dob).days
    if days < 0:
        return {"age_days": days, "age_months": None, "age_years": None}
    months = days // 30
    years = days / 365.25
    return {"age_days": days, "age_months": months, "age_years": years}


def get_child_core_details(db: Session, child_id: int) -> Optional[Dict[str, Any]]:
    child: Optional[ChildModel] = (
        db.query(ChildModel)
        .filter(ChildModel.child_id == child_id)
        .first()
    )
    if not child:
        return None
    age = _age_fields(child.date_of_birth)
    return {
        # Minimal set used for guidance and personalization
        "full_name": child.full_name,
        "gender": child.gender,
        "age_days": age.get("age_days"),
        "age_months": age.get("age_months"),
        "age_years": age.get("age_years"),
    }


def get_child_nutrition_summary(db: Session, child_id: int) -> Dict[str, Any]:
    summary = crud_nutrition.get_child_weekly_nutrition_summary(db, child_id=child_id, week_start=None)
    return {
        "has_data": summary.get("has_data", False),
        "age_months": summary.get("age_months"),
        "percent_of_requirement": summary.get("percent_of_requirement") or {},
        "adequacy": summary.get("adequacy") or {},
        "needed_nutrients": summary.get("needed_nutrients") or [],
        "top_foods_by_nutrient": summary.get("top_foods_by_nutrient") or {},
        "recommended_recipes": summary.get("recommended_recipes") or [],
        "message": summary.get("message"),
    }


def get_child_latest_growth(db: Session, child_id: int) -> Optional[Dict[str, Any]]:
    row: Optional[ChildAnthropometryModel] = (
        db.query(ChildAnthropometryModel)
        .filter(ChildAnthropometryModel.child_id == child_id)
        .order_by(ChildAnthropometryModel.log_date.desc(), ChildAnthropometryModel.id.desc())
        .first()
    )
    if not row:
        return None
    bmi = None
    if row.height_cm and row.weight_kg and row.height_cm > 0:
        h_m = row.height_cm / 100.0
        bmi = round(row.weight_kg / (h_m * h_m), 2)
    return {
        "log_date": row.log_date.isoformat(),
        "height_cm": row.height_cm,
        "weight_kg": row.weight_kg,
        "muac_cm": row.muac_cm,
        "avg_sleep_hours_per_day": row.avg_sleep_hours_per_day,
        "bmi": bmi,
    }


def get_child_current_illnesses(db: Session, child_id: int) -> List[Dict[str, Any]]:
    rows: List[ChildIllnessLogModel] = crud.list_child_illness_logs(db, child_id=child_id, status="current")
    result: List[Dict[str, Any]] = []
    for r in rows:
        severity = None
        if getattr(r, "severity", None) is not None:
            sev = r.severity
            severity = getattr(sev, "value", sev)
        result.append(
            {
                "id": r.id,
                "fever": r.fever,
                "cold": r.cold,
                "cough": r.cough,
                "sore_throat": r.sore_throat,
                "headache": r.headache,
                "stomach_ache": r.stomach_ache,
                "nausea": r.nausea,
                "vomiting": r.vomiting,
                "diarrhea": r.diarrhea,
                "rash": r.rash,
                "fatigue": r.fatigue,
                "loss_of_appetite": r.loss_of_appetite,
                "temperature_c": r.temperature_c,
                "severity": severity,
                "is_current": r.is_current,
                "symptom_start_date": r.symptom_start_date.isoformat() if r.symptom_start_date else None,
                "notes": r.notes,
            }
        )
    return result


def get_child_chatbot_context(db: Session, child_id: int) -> Dict[str, Any]:
    core = get_child_core_details(db, child_id)
    nutrition = get_child_nutrition_summary(db, child_id)
    growth = get_child_latest_growth(db, child_id)
    illnesses = get_child_current_illnesses(db, child_id)
    return {
        "child": core,
        "nutrition": nutrition,
        "growth": growth,
        "current_illnesses": illnesses,
    }
