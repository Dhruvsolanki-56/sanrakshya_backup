from datetime import date, timedelta
from typing import Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    Child,
    ChildMealLog as ChildMealLogModel,
    ChildMealItem as ChildMealItemModel,
    NutritionRequirement,
    NutritionRecipe,
)
from app.schemas.schemas import FoodAgeGroupEnum
from app.db.crud import compute_child_age_group, list_foods_by_age_group


def _get_week_range_for_child(db: Session, child_id: int, start: date | None) -> tuple[date | None, date | None]:
    """Return a 7-day window ending on the child's last log date.

    If start is provided, use [start, start+6].
    If start is None, find the child's latest log_date and use
    [latest-6, latest]. If there are no logs, return (None, None).
    """
    if start is not None:
        end = start + timedelta(days=6)
        return start, end

    latest: date | None = (
        db.query(func.max(ChildMealLogModel.log_date))
        .filter(ChildMealLogModel.child_id == child_id)
        .scalar()
    )
    if latest is None:
        return None, None

    end = latest
    start = end - timedelta(days=6)
    return start, end


def seed_nutrition_recipes(db: Session, payload: Dict[str, Any]) -> dict:
    """Seed or upsert nutrition recipes from the provided JSON structure.

    Expected payload shape (simplified):
    {
      "groups": [
        {
          "age_min_months": int,
          "age_max_months": int,
          "recipes": [
            {
              "recipe_id": str,
              "recipe_name": str,
              "veg_nonveg": str,
              "primary_nutrient": str,
              "secondary_nutrients": [str, ...],
              "energy_density": str,
              "meal_type": str,
              "texture": str,
              "ingredients": str,
              "instructions": str,
              "prep_time_mins": int,
              "youtube_video_id": str,
            },
            ...
          ]
        },
        ...
      ]
    }
    """
    groups = payload.get("groups") or []
    if not isinstance(groups, list):
        return {"inserted": 0, "updated": 0}

    inserted = 0
    updated = 0

    for group in groups:
        age_min = int(group.get("age_min_months", 0) or 0)
        age_max = int(group.get("age_max_months", 0) or 0)
        recipes = group.get("recipes") or []
        if not isinstance(recipes, list):
            continue

        for r in recipes:
            code = str(r.get("recipe_id") or "").strip()
            if not code:
                continue

            youtube_id = r.get("youtube_video_id") or ""
            youtube_id = str(youtube_id).strip()
            if youtube_id.startswith("http://") or youtube_id.startswith("https://"):
                youtube_url = youtube_id
            elif youtube_id:
                youtube_url = f"https://www.youtube.com/watch?v={youtube_id}"
            else:
                youtube_url = None

            secondary_list = r.get("secondary_nutrients") or []
            if isinstance(secondary_list, list):
                secondary_str = ",".join(str(x) for x in secondary_list)
            else:
                secondary_str = str(secondary_list) if secondary_list is not None else None

            row = (
                db.query(NutritionRecipe)
                .filter(NutritionRecipe.recipe_code == code)
                .first()
            )

            fields = {
                "age_min_months": age_min,
                "age_max_months": age_max,
                "recipe_name": r.get("recipe_name"),
                "veg_nonveg": r.get("veg_nonveg"),
                "primary_nutrient": r.get("primary_nutrient"),
                "secondary_nutrients": secondary_str,
                "energy_density": r.get("energy_density"),
                "meal_type": r.get("meal_type"),
                "texture": r.get("texture"),
                "ingredients": r.get("ingredients"),
                "instructions": r.get("instructions"),
                "prep_time_mins": r.get("prep_time_mins"),
                "youtube_url": youtube_url,
            }

            if row:
                changed = False
                for k, v in fields.items():
                    if getattr(row, k) != v:
                        setattr(row, k, v)
                        changed = True
                if changed:
                    updated += 1
            else:
                row = NutritionRecipe(recipe_code=code, **fields)
                db.add(row)
                inserted += 1

    db.commit()
    return {"inserted": inserted, "updated": updated}


def get_child_weekly_nutrition_summary(
    db: Session,
    *,
    child_id: int,
    week_start: date | None = None,
) -> Dict[str, Any]:
    start, end = _get_week_range_for_child(db, child_id, week_start)
    if start is None or end is None:
        # No logs at all for this child
        return {
            "child_id": child_id,
            "has_data": False,
            "age_months": None,
            "percent_of_requirement": {},
            "adequacy": {},
            "needed_nutrients": [],
            "top_foods_by_nutrient": {},
            "recommended_recipes": [],
            "message": "No meal logs found for this child.",
        }

    child: Child | None = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        return {
            "child_id": child_id,
            "has_data": False,
            "age_months": None,
            "percent_of_requirement": {},
            "adequacy": {},
            "needed_nutrients": [],
            "top_foods_by_nutrient": {},
            "recommended_recipes": [],
            "message": "Child not found.",
        }

    # Fixed 7-day window based on last log (or explicit start)
    days_with_logs = 7

    # Aggregate weekly nutrient totals using SQL for performance
    totals_row = (
        db.query(
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.energy_kcal, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("energy_kcal"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.protein_g, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("protein_g"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.carb_g, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("carb_g"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.fat_g, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("fat_g"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.iron_mg, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("iron_mg"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.calcium_mg, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("calcium_mg"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.vitamin_a_mcg, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("vitamin_a_mcg"),
            func.coalesce(
                func.sum(
                    func.coalesce(ChildMealItemModel.vitamin_c_mg, 0.0)
                    * ChildMealItemModel.meal_frequency
                ),
                0.0,
            ).label("vitamin_c_mg"),
        )
        .join(ChildMealLogModel, ChildMealItemModel.meal_log_id == ChildMealLogModel.id)
        .filter(
            ChildMealLogModel.child_id == child_id,
            ChildMealLogModel.log_date >= start,
            ChildMealLogModel.log_date <= end,
        )
        .one_or_none()
    )

    if totals_row is None:
        totals = {
            "energy_kcal": 0.0,
            "protein_g": 0.0,
            "carb_g": 0.0,
            "fat_g": 0.0,
            "iron_mg": 0.0,
            "calcium_mg": 0.0,
            "vitamin_a_mcg": 0.0,
            "vitamin_c_mg": 0.0,
        }
    else:
        totals = {
            "energy_kcal": float(totals_row.energy_kcal or 0.0),
            "protein_g": float(totals_row.protein_g or 0.0),
            "carb_g": float(totals_row.carb_g or 0.0),
            "fat_g": float(totals_row.fat_g or 0.0),
            "iron_mg": float(totals_row.iron_mg or 0.0),
            "calcium_mg": float(totals_row.calcium_mg or 0.0),
            "vitamin_a_mcg": float(totals_row.vitamin_a_mcg or 0.0),
            "vitamin_c_mg": float(totals_row.vitamin_c_mg or 0.0),
        }

    daily_avg = {k: (v / days_with_logs) if days_with_logs > 0 else 0.0 for k, v in totals.items()}

    # Determine age in months at end of week
    ref_date = end
    age_days = (ref_date - child.date_of_birth).days
    age_months = int(age_days / 30.4375) if age_days > 0 else 0

    # Select requirement row where child's age (in months) falls in [age_min_months, age_max_months]
    requirement: NutritionRequirement | None = (
        db.query(NutritionRequirement)
        .filter(
            NutritionRequirement.age_min_months <= age_months,
            NutritionRequirement.age_max_months >= age_months,
        )
        .order_by(NutritionRequirement.age_min_months.desc())
        .first()
    )

    requirement_data = None
    gap: Dict[str, float] = {k: 0.0 for k in totals.keys()}
    percent: Dict[str, float] = {k: 0.0 for k in totals.keys()}
    adequacy: Dict[str, str] = {k: "unknown" for k in totals.keys()}
    needed_nutrients: list[str] = []

    if requirement is not None:
        requirement_data = {
            "age_min_months": requirement.age_min_months,
            "age_max_months": requirement.age_max_months,
            "energy_kcal": requirement.energy_kcal,
            "protein_g": requirement.protein_g,
            "carb_g": requirement.carb_g,
            "fat_g": requirement.fat_g,
            "iron_mg": requirement.iron_mg,
            "calcium_mg": requirement.calcium_mg,
            "vitamin_a_mcg": requirement.vitamin_a_mcg,
            "vitamin_c_mg": requirement.vitamin_c_mg,
        }
        for key in totals.keys():
            req_value = float(getattr(requirement, key)) if getattr(requirement, key) is not None else 0.0
            # Positive gap means "still required" (requirement minus intake)
            diff = req_value - daily_avg[key]
            gap[key] = diff

            # percent_of_requirement expresses how much % of the requirement has been taken
            intake_pct = (daily_avg[key] / req_value * 100.0) if req_value > 0 else 0.0
            percent[key] = intake_pct

            if req_value <= 0:
                adequacy[key] = "not_applicable"
            elif intake_pct < 90.0:
                adequacy[key] = "deficit"
            elif intake_pct <= 120.0:
                adequacy[key] = "adequate"
            else:
                adequacy[key] = "excess"

    # Sort needed nutrients by highest deficit severity (100 - percent_of_requirement)
    deficit_items: list[tuple[str, float]] = []
    for k in totals.keys():
        if adequacy.get(k) == "deficit":
            try:
                pct_val = float(percent.get(k, 0.0) or 0.0)
            except (TypeError, ValueError):
                pct_val = 0.0
            sev = max(0.0, 100.0 - pct_val)
            if sev > 0.0:
                deficit_items.append((k, sev))
    deficit_items.sort(key=lambda kv: kv[1], reverse=True)
    needed_nutrients = [k for k, _ in deficit_items]

    # Recommended foods for this child's age group
    age_group = compute_child_age_group(child.date_of_birth)
    gmap = {
        "Infant": FoodAgeGroupEnum.INFANT,
        "Toddler": FoodAgeGroupEnum.TODDLER,
        "Preschool": FoodAgeGroupEnum.PRESCHOOL,
        "SchoolAge": FoodAgeGroupEnum.SCHOOLAGE,
    }
    group_val = age_group.value if hasattr(age_group, "value") else str(age_group)
    food_group = gmap.get(group_val, FoodAgeGroupEnum.ALL)

    foods = list_foods_by_age_group(db, food_group)
    is_infant_group = age_group == FoodAgeGroupEnum.INFANT or group_val == "Infant"
    # For infants, do not flag iron as "excess"; treat as "adequate" if above requirement
    if is_infant_group:
        if "iron_mg" in adequacy and adequacy["iron_mg"] == "excess":
            adequacy["iron_mg"] = "adequate"
    # For infants, restrict to milk-only items
    if is_infant_group:
        foods = [f for f in foods if (getattr(f, "food_group", None) or "").lower() == "milk"]
    if age_months <= 6:
        def _is_breastmilk_like_food(f) -> bool:
            name = (getattr(f, "food_name", "") or "").lower()
            text = name + " " + (getattr(f, "food_group", "") or "").lower()
            keywords = [
                "breastmilk",
                "breast milk",
                "breast-feeding",
                "breastfeeding",
                "mother's milk",
                "mothers milk",
                "human milk",
                "infant formula",
                "baby formula",
                "formula milk",
            ]
            return any(k in text for k in keywords)

        foods = [f for f in foods if _is_breastmilk_like_food(f)]

    # For each needed nutrient, suggest foods richest in that nutrient
    top_foods_by_nutrient: Dict[str, list[dict]] = {}
    nutrient_attr_map = {
        "energy_kcal": "energy_kcal",
        "protein_g": "protein_g",
        "carb_g": "carb_g",
        "fat_g": "fat_g",
        "iron_mg": "iron_mg",
        "calcium_mg": "calcium_mg",
        "vitamin_a_mcg": "vitamin_a_mcg",
        "vitamin_c_mg": "vitamin_c_mg",
    }
    for nutrient in needed_nutrients:
        attr = nutrient_attr_map.get(nutrient)
        if not attr:
            continue
        sorted_foods = sorted(
            foods,
            key=lambda f: float(getattr(f, attr) or 0.0),
            reverse=True,
        )
        top_foods_by_nutrient[nutrient] = [
            {
                "food_id": f.food_id,
                "food_name": f.food_name,
                "food_group": f.food_group,
            }
            for f in sorted_foods[:5]
        ]

    id_to_food = {f.food_id: f for f in foods}
    recommended_food_ids: set[int] = set()
    for flist in top_foods_by_nutrient.values():
        for item in flist:
            fid = item.get("food_id")
            if fid is not None:
                recommended_food_ids.add(fid)

    recommended_foods = [
        {
            "food_id": f.food_id,
            "food_name": f.food_name,
            "category_age_group": f.category_age_group.value if hasattr(f.category_age_group, "value") else str(f.category_age_group),
            "food_group": f.food_group,
            "is_veg": f.is_veg,
        }
        for fid, f in id_to_food.items()
        if fid in recommended_food_ids
    ]

    recommended_recipes: list[dict] = []
    if requirement_data is not None and needed_nutrients:
        severity: Dict[str, float] = {}
        for key, pct in percent.items():
            try:
                pct_val = float(pct or 0.0)
            except (TypeError, ValueError):
                pct_val = 0.0
            severity[key] = max(0.0, 100.0 - pct_val)

        excess_nutrients = {k for k, v in adequacy.items() if v == "excess"}

        deficit_severity_items = [
            (k, severity.get(k, 0.0))
            for k in needed_nutrients
            if adequacy.get(k) == "deficit"
        ]
        deficit_severity_items.sort(key=lambda kv: kv[1], reverse=True)
        ordered_deficits = [k for k, s in deficit_severity_items if s > 0.0]
        if not ordered_deficits:
            ordered_deficits = list(needed_nutrients)

        energy_pct = float(percent.get("energy_kcal", 0.0) or 0.0)
        energy_deficit_severe = energy_pct < 60.0

        recipes_q = (
            db.query(NutritionRecipe)
            .filter(
                NutritionRecipe.age_min_months <= age_months,
                NutritionRecipe.age_max_months >= age_months,
            )
        )
        all_recipes = recipes_q.all()

        def _parse_secondary(r: NutritionRecipe) -> list[str]:
            text = r.secondary_nutrients or ""
            return [x.strip() for x in text.split(",") if x.strip()]

        def _is_recipe_safe(r: NutritionRecipe) -> bool:
            tx = (r.texture or "").lower().strip()
            text = ((r.ingredients or "") + " " + (r.recipe_name or "")).lower()
            if age_months <= 6:
                if tx not in ("liquid", "soft"):
                    return False
                milk_keywords = [
                    "breastmilk",
                    "breast milk",
                    "breast-feeding",
                    "breastfeeding",
                    "mother's milk",
                    "mothers milk",
                    "human milk",
                    "infant formula",
                    "baby formula",
                    "formula milk",
                ]
                if not any(k in text for k in milk_keywords):
                    return False
                banned_words = [
                    "honey",
                    "whole nut",
                    "whole nuts",
                    "peanut",
                    "groundnut",
                    "almond",
                    "cashew",
                    "pista",
                    "walnut",
                    "fried",
                    "deep fry",
                    "deep-fried",
                ]
                if any(w in text for w in banned_words):
                    return False
            elif age_months < 12:
                if tx not in ("liquid", "soft"):
                    return False
                banned_words = [
                    "honey",
                    "whole nut",
                    "whole nuts",
                    "peanut",
                    "groundnut",
                    "almond",
                    "cashew",
                    "pista",
                    "walnut",
                    "fried",
                    "deep fry",
                    "deep-fried",
                ]
                if any(w in text for w in banned_words):
                    return False
            elif 12 <= age_months < 36:
                if tx not in ("soft", "semi-solid"):
                    return False
            return True

        def _is_snack(r: NutritionRecipe) -> bool:
            meal = (r.meal_type or "").lower().strip()
            return meal == "snack"

        candidates: list[tuple[float, NutritionRecipe]] = []

        for r in all_recipes:
            primary = (r.primary_nutrient or "").strip()
            if not primary:
                continue
            if primary not in needed_nutrients:
                continue
            if primary in excess_nutrients:
                continue
            if not _is_recipe_safe(r):
                continue

            secondary_list = _parse_secondary(r)
            if any(n in excess_nutrients for n in secondary_list):
                continue

            base_severity = severity.get(primary, 0.0)
            if base_severity <= 0.0:
                continue

            score = base_severity * 10.0

            overlap_count = sum(1 for n in secondary_list if n in needed_nutrients)
            score += float(overlap_count)

            meal = (r.meal_type or "").lower().strip()
            pref_meals_map = {
                "energy_kcal": ["lunch", "dinner"],
                "protein_g": ["lunch"],
                "calcium_mg": ["breakfast", "snack"],
                "vitamin_c_mg": ["snack"],
                "vitamin_a_mcg": ["lunch"],
                "fat_g": ["lunch", "dinner"],
            }
            preferred_meals = pref_meals_map.get(primary, [])
            if meal in preferred_meals:
                score += 5.0

            if energy_deficit_severe and primary == "energy_kcal":
                if r.energy_density and r.energy_density.lower() == "high":
                    score += 10.0
                else:
                    score += 5.0

            candidates.append((score, r))

        candidates.sort(key=lambda x: x[0], reverse=True)

        MAX_RECIPES = 2 if age_months <= 6 else 4
        selected: list[NutritionRecipe] = []
        selected_ids: set[int] = set()

        # Ensure at least one strong energy recipe when energy deficit is severe
        if energy_deficit_severe:
            for _, r in candidates:
                primary_name = (r.primary_nutrient or "").strip()
                if primary_name == "energy_kcal":
                    selected.append(r)
                    if getattr(r, "id", None) is not None:
                        selected_ids.add(r.id)
                    break

        for _, r in candidates:
            if len(selected) >= MAX_RECIPES:
                break
            if getattr(r, "id", None) is not None and r.id in selected_ids:
                continue
            selected.append(r)
            if getattr(r, "id", None) is not None:
                selected_ids.add(r.id)

        def _recipe_to_dict(r: NutritionRecipe) -> dict:
            secondary_list = _parse_secondary(r)
            return {
                "id": r.id,
                "recipe_code": r.recipe_code,
                "recipe_name": r.recipe_name,
                "veg_nonveg": r.veg_nonveg,
                "primary_nutrient": r.primary_nutrient,
                "secondary_nutrients": secondary_list,
                "energy_density": r.energy_density,
                "meal_type": r.meal_type,
                "texture": r.texture,
                "ingredients": r.ingredients,
                "instructions": r.instructions,
                "prep_time_mins": r.prep_time_mins,
                "youtube_url": r.youtube_url,
            }

        for r in selected:
            recommended_recipes.append(_recipe_to_dict(r))

    return {
        "child_id": child_id,
        "has_data": True,
        "age_months": age_months,
        "percent_of_requirement": percent,
        "adequacy": adequacy,
        "needed_nutrients": needed_nutrients,
        "top_foods_by_nutrient": top_foods_by_nutrient,
        "recommended_recipes": recommended_recipes,
        "message": None,
    }
