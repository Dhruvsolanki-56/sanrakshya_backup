from sqlalchemy.orm import Session
from app.models.models import (
  
    Parent,
    Child,
    ParentProfilePhoto,
    ChildProfilePhoto,
    VaccinationSchedule,
    ChildVaccineStatus,
    ChildMilestone,
    ChildMilestoneStatus,
    NutritionRequirement,
)
from app.schemas.schemas import (
  
    ParentCreate,
    ChildCreate,
    ChildUpdate,
    VaccineCategoryEnum,
    VaccineStatusEnum,
    ChildVaccineStatusCreate,
    ChildVaccineStatusUpdate,
    VaccinationScheduleCreate,
    VaccinationAgeGroupEnum,
    ChildMilestoneStatusCreate,
    ChildMilestoneStatusUpdate,
)
from app.core.security import get_password_hash
from datetime import date
from typing import Optional, Literal, List as _List
from app.models.models import ChildIllnessLog
from app.models.models import ChildAnthropometry as ChildAnthropometryModel
from app.schemas.schemas import ChildIllnessLogCreate, ChildIllnessLogUpdate, ResolveIllnessLogRequest
from app.schemas.schemas import ChildAnthropometryCreate as ChildAnthropometryCreateSchema
from app.models.models import FoodMaster
from app.models.models import ChildMealLog as ChildMealLogModel
from app.models.models import ChildMealItem as ChildMealItemModel
from app.schemas.schemas import FoodAgeGroupEnum
from app.schemas.schemas import ChildMealLogCreate as ChildMealLogCreateSchema
from app.schemas.schemas import MealTypeEnum
from app.schemas.schemas import Child as ChildSchema
from datetime import timedelta
from app.services.gemini import estimate_nutrition



def get_parent_by_email(db: Session, email: str):
    return db.query(Parent).filter(Parent.email == email, Parent.is_active == True).first()

def get_parent_by_id_active(db: Session, parent_id: int):
    return db.query(Parent).filter(Parent.parent_id == parent_id, Parent.is_active == True).first()

def get_parent_by_email_any(db: Session, email: str):
    return db.query(Parent).filter(Parent.email == email).first()

def get_parent_by_phone_any(db: Session, phone_number: str):
    return db.query(Parent).filter(Parent.phone_number == phone_number).first()


def create_child_meal_log(
    db: Session,
    *,
    child_id: int,
    payload: ChildMealLogCreateSchema,
):
    row = ChildMealLogModel(
        child_id=child_id,
        log_date=date.today(),
        notes=payload.notes,
    )
    db.add(row)
    db.flush()
    for item in payload.items:
        if (item.food_id is None and not item.custom_food_name) or (item.food_id is not None and item.custom_food_name):
            raise ValueError("Each item must provide either food_id or custom_food_name")
        nutrients = None
        ai_flag = False
        if item.food_id is not None:
            master = db.query(FoodMaster).filter(FoodMaster.food_id == item.food_id).first()
            if not master:
                raise ValueError("food_id not found")
            nutrients = _compute_nutrition_from_master(master, item.serving_size_g)
        else:
            est = estimate_nutrition(item.custom_food_name, item.serving_size_g)
            if est:
                ai_flag = True
                nutrients = {
                    'energy_kcal': est.get('energy_kcal'),
                    'protein_g': est.get('protein_g'),
                    'carb_g': est.get('carb_g'),
                    'fat_g': est.get('fat_g'),
                    'iron_mg': est.get('iron_mg'),
                    'calcium_mg': est.get('calcium_mg'),
                    'vitamin_a_mcg': est.get('vitamin_a_mcg'),
                    'vitamin_c_mg': est.get('vitamin_c_mg'),
                }
        if nutrients is None:
            nutrients = {
                'energy_kcal': 0.0,
                'protein_g': 0.0,
                'carb_g': 0.0,
                'fat_g': 0.0,
                'iron_mg': 0.0,
                'calcium_mg': 0.0,
                'vitamin_a_mcg': 0.0,
                'vitamin_c_mg': 0.0,
            }
        db.add(ChildMealItemModel(
            meal_log_id=row.id,
            meal_type=item.meal_type,
            food_id=item.food_id,
            custom_food_name=item.custom_food_name,
            serving_size_g=item.serving_size_g,
            meal_frequency=item.meal_frequency,
            is_ai_estimated=ai_flag,
            energy_kcal=nutrients.get('energy_kcal'),
            protein_g=nutrients.get('protein_g'),
            carb_g=nutrients.get('carb_g'),
            fat_g=nutrients.get('fat_g'),
            iron_mg=nutrients.get('iron_mg'),
            calcium_mg=nutrients.get('calcium_mg'),
            vitamin_a_mcg=nutrients.get('vitamin_a_mcg'),
            vitamin_c_mg=nutrients.get('vitamin_c_mg'),
        ))
    db.commit()
    db.refresh(row)
    return row

def create_child_anthropometry(
    db: Session,
    *,
    child_id: int,
    payload: ChildAnthropometryCreateSchema,
):
    row = ChildAnthropometryModel(
        child_id=child_id,
        log_date=date.today(),
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        muac_cm=payload.muac_cm,
        avg_sleep_hours_per_day=payload.avg_sleep_hours_per_day,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def list_child_meal_logs_between(db: Session, child_id: int, start_date: date, end_date: date):
    return (
        db.query(ChildMealLogModel)
        .filter(
            ChildMealLogModel.child_id == child_id,
            ChildMealLogModel.log_date >= start_date,
            ChildMealLogModel.log_date <= end_date,
        )
        .order_by(ChildMealLogModel.log_date.asc(), ChildMealLogModel.id.asc())
        .all()
    )


def get_latest_child_meal_log(db: Session, child_id: int):
    return (
        db.query(ChildMealLogModel)
        .filter(ChildMealLogModel.child_id == child_id)
        .order_by(ChildMealLogModel.log_date.desc(), ChildMealLogModel.id.desc())
        .first()
    )

def create_parent(db: Session, parent: ParentCreate):
    hashed_password = get_password_hash(parent.password)
    db_parent = Parent(
        full_name=parent.full_name,
        email=parent.email,
        phone_number=parent.phone_number,
        password_hash=hashed_password
    )
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    return db_parent


def get_parent_profile_photo(db: Session, *, parent_id: int) -> ParentProfilePhoto | None:
    return db.query(ParentProfilePhoto).filter(ParentProfilePhoto.parent_id == parent_id).first()


def upsert_parent_profile_photo(
    db: Session,
    *,
    parent_id: int,
    photo_url: str,
    mime_type: str | None = None,
    file_size: int | None = None,
) -> ParentProfilePhoto:
    row = get_parent_profile_photo(db, parent_id=parent_id)
    if not row:
        row = ParentProfilePhoto(
            parent_id=parent_id,
            photo_url=photo_url,
            mime_type=mime_type,
            file_size=file_size,
        )
    else:
        row.photo_url = photo_url
        row.mime_type = mime_type
        row.file_size = file_size
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_parent_profile_photo(db: Session, *, parent_id: int) -> bool:
    row = get_parent_profile_photo(db, parent_id=parent_id)
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def update_parent(db: Session, db_parent: Parent, updates):
    # updates is ParentUpdate schema
    if getattr(updates, 'full_name', None) is not None:
        db_parent.full_name = updates.full_name
    if getattr(updates, 'email', None) is not None:
        db_parent.email = updates.email
    if getattr(updates, 'phone_number', None) is not None:
        db_parent.phone_number = updates.phone_number
    db.commit()
    db.refresh(db_parent)
    return db_parent

# Children CRUD
def list_children_by_parent(db: Session, parent_id: int):
    return db.query(Child).filter(Child.parent_id == parent_id).all()

def get_child_by_id_and_parent(db: Session, child_id: int, parent_id: int):
    return db.query(Child).filter(Child.child_id == child_id, Child.parent_id == parent_id).first()

def create_child(db: Session, parent_id: int, child: ChildCreate):
    db_child = Child(
        parent_id=parent_id,
        full_name=child.full_name,
        gender=child.gender.value if hasattr(child.gender, 'value') and child.gender is not None else child.gender,
        blood_group=child.blood_group.value if hasattr(child.blood_group, 'value') and child.blood_group is not None else child.blood_group,
        date_of_birth=child.date_of_birth,
    )
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    return db_child


def get_child_profile_photo(db: Session, *, child_id: int) -> ChildProfilePhoto | None:
    return db.query(ChildProfilePhoto).filter(ChildProfilePhoto.child_id == child_id).first()


def upsert_child_profile_photo(
    db: Session,
    *,
    child_id: int,
    photo_url: str,
    mime_type: str | None = None,
    file_size: int | None = None,
) -> ChildProfilePhoto:
    row = get_child_profile_photo(db, child_id=child_id)
    if not row:
        row = ChildProfilePhoto(
            child_id=child_id,
            photo_url=photo_url,
            mime_type=mime_type,
            file_size=file_size,
        )
    else:
        row.photo_url = photo_url
        row.mime_type = mime_type
        row.file_size = file_size
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_child_profile_photo(db: Session, *, child_id: int) -> bool:
    row = get_child_profile_photo(db, child_id=child_id)
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def update_child(db: Session, db_child: Child, updates: ChildUpdate):
    if updates.full_name is not None:
        db_child.full_name = updates.full_name
    if updates.gender is not None:
        db_child.gender = updates.gender.value if hasattr(updates.gender, 'value') else updates.gender
    if updates.blood_group is not None:
        db_child.blood_group = updates.blood_group.value if hasattr(updates.blood_group, 'value') else updates.blood_group
    if updates.date_of_birth is not None:
        db_child.date_of_birth = updates.date_of_birth
    db.commit()
    db.refresh(db_child)
    return db_child

def delete_child(db: Session, db_child: Child):
    db.delete(db_child)
    db.commit()
    return True

def _compute_nutrition_from_master(master: FoodMaster, serving_size_g: float):
    if master is None or serving_size_g is None:
        return None
    base = master.avg_serving_g or 100.0
    if base <= 0:
        return None
    r = serving_size_g / base
    def mul(v):
        return float(v) * r if v is not None else None
    return {
        'energy_kcal': mul(master.energy_kcal),
        'protein_g': mul(master.protein_g),
        'carb_g': mul(master.carb_g),
        'fat_g': mul(master.fat_g),
        'iron_mg': mul(master.iron_mg),
        'calcium_mg': mul(master.calcium_mg),
        'vitamin_a_mcg': mul(master.vitamin_a_mcg),
        'vitamin_c_mg': mul(master.vitamin_c_mg),
    }


# Vaccination schedule CRUD / helpers (unified)
def _upsert_schedule_row(db: Session, name: str, disease: str, age_text: str, doses: int, category: VaccineCategoryEnum, group: VaccinationAgeGroupEnum):
    # Normalize common unicode punctuation to ASCII for consistent storage
    def _normalize(s: str) -> str:
        if s is None:
            return s
        return (
            s.replace('\u2013', '-')  # en dash
             .replace('\u2014', '-')  # em dash
             .replace('\u2212', '-')  # minus sign
             .replace('\u2011', '-')  # non-breaking hyphen
             .replace('\u00A0', ' ')  # non-breaking space
        )

    name = _normalize(name)
    disease = _normalize(disease)
    age_text = _normalize(age_text)
    existing = (
        db.query(VaccinationSchedule)
        .filter(
            VaccinationSchedule.vaccine_name == name,
            VaccinationSchedule.age_group == group,
        )
        .first()
    )
    if existing:
        # Optionally update descriptive fields if changed
        changed = False
        if existing.disease_prevented != disease:
            existing.disease_prevented = disease; changed = True
        if existing.recommended_age != age_text:
            existing.recommended_age = age_text; changed = True
        if existing.doses_required != doses:
            existing.doses_required = doses; changed = True
        if existing.category != category:
            existing.category = category; changed = True
        if changed:
            db.commit(); db.refresh(existing)
        return existing
    row = VaccinationSchedule(
        vaccine_name=name,
        disease_prevented=disease,
        recommended_age=age_text,
        doses_required=doses,
        category=category,
        age_group=group,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
def _upsert_food(
    db: Session,
    *,
    food_name: str,
    category_age_group: FoodAgeGroupEnum,
    food_group: str | None,
    avg_serving_g: float | None,
    energy_kcal: float | None,
    protein_g: float | None,
    carb_g: float | None,
    fat_g: float | None,
    iron_mg: float | None,
    calcium_mg: float | None,
    vitamin_a_mcg: float | None,
    vitamin_c_mg: float | None,
    is_veg: bool,
):
    existing = (
        db.query(FoodMaster)
        .filter(
            FoodMaster.food_name == food_name,
            FoodMaster.category_age_group == category_age_group,
        )
        .first()
    )
    fields = {
        'food_group': food_group,
        'avg_serving_g': avg_serving_g,
        'energy_kcal': energy_kcal,
        'protein_g': protein_g,
        'carb_g': carb_g,
        'fat_g': fat_g,
        'iron_mg': iron_mg,
        'calcium_mg': calcium_mg,
        'vitamin_a_mcg': vitamin_a_mcg,
        'vitamin_c_mg': vitamin_c_mg,
        'is_veg': is_veg,
    }
    if existing:
        changed = False
        for k, v in fields.items():
            if getattr(existing, k) != v:
                setattr(existing, k, v)
                changed = True
        if changed:
            db.commit(); db.refresh(existing)
        return existing
    row = FoodMaster(
        food_name=food_name,
        category_age_group=category_age_group,
        **fields,
    )
    db.add(row)
    db.commit(); db.refresh(row)
    return row

def list_foods_by_age_group(db: Session, age_group: FoodAgeGroupEnum):
    return (
        db.query(FoodMaster)
        .filter(FoodMaster.category_age_group.in_([age_group, FoodAgeGroupEnum.ALL]))
        .order_by(FoodMaster.food_group.asc().nulls_last(), FoodMaster.food_name.asc())
        .all()
    )

def seed_food_master(db: Session):
    data = [
        ("Breast milk", "infant", "milk", 100, 70, 1.0, 7.0, 4.0, 0.1, 35, 50, 2, True),
        ("Formula milk", "infant", "milk", 100, 65, 1.2, 6.0, 3.5, 0.1, 40, 60, 0, True),
        ("Rice porridge", "infant", "cereal", 100, 110, 2.0, 23.0, 1.5, 0.2, 8, 0, 0, True),
        ("Mixed vegetable soup", "infant", "vegetable", 100, 45, 1.5, 8.0, 0.6, 0.3, 15, 20, 10, True),
        ("Khichdi", "toddler", "mixed", 150, 180, 5.5, 28.0, 4.0, 1.0, 25, 20, 0, True),
        ("Suji upma", "toddler", "cereal", 100, 130, 3.0, 21.0, 3.0, 0.5, 15, 30, 2, True),
        ("Idli", "toddler", "cereal", 50, 60, 2.0, 12.0, 0.4, 0.2, 8, 10, 0, True),
        ("Suji halwa", "toddler", "sweet", 60, 150, 2.0, 25.0, 5.0, 0.3, 10, 0, 0, True),
        ("Chapati", "preschool", "cereal", 40, 120, 3.0, 20.0, 2.0, 1.0, 10, 0, 0, True),
        ("Dal (cooked)", "preschool", "pulse", 100, 110, 6.0, 15.0, 2.0, 1.5, 25, 10, 0, True),
        ("Rice (cooked)", "preschool", "cereal", 100, 130, 2.4, 28.0, 0.3, 0.2, 10, 0, 0, True),
        ("Paneer", "preschool", "milk", 50, 130, 8.0, 3.0, 10.0, 0.2, 100, 50, 0, True),
        ("Vegetable curry", "preschool", "vegetable", 100, 90, 2.0, 10.0, 4.0, 1.0, 40, 20, 8, True),
        ("Dosa", "preschool", "cereal", 100, 160, 3.5, 25.0, 4.5, 1.0, 25, 15, 0, True),
        ("Paratha", "schoolage", "cereal", 80, 220, 5.0, 25.0, 10.0, 1.0, 20, 20, 0, True),
        ("Poha", "schoolage", "cereal", 100, 140, 3.0, 26.0, 3.0, 0.8, 10, 0, 0, True),
        ("Biryani", "schoolage", "mixed", 150, 290, 10.0, 35.0, 10.0, 1.0, 25, 20, 0, False),
        ("Chicken curry", "schoolage", "meat", 150, 270, 25.0, 5.0, 16.0, 2.0, 25, 50, 0, False),
        ("Fish curry", "schoolage", "meat", 150, 230, 22.0, 3.0, 13.0, 1.5, 30, 45, 0, False),
        ("Milk", "all", "milk", 100, 67, 3.3, 5.0, 3.5, 0.1, 120, 60, 0, True),
        ("Curd", "all", "milk", 100, 90, 3.1, 4.5, 6.0, 0.1, 80, 40, 0, True),
        ("Banana", "all", "fruit", 80, 70, 0.6, 18.0, 0.2, 0.3, 6, 20, 5, True),
        ("Apple", "all", "fruit", 100, 50, 0.3, 13.0, 0.1, 0.1, 6, 54, 4, True),
        ("Boiled egg", "preschool", "egg", 50, 70, 6.3, 0.6, 5.0, 1.2, 25, 100, 0, False),
        ("Sprouts", "schoolage", "pulse", 50, 85, 5.0, 14.0, 1.0, 1.5, 30, 0, 0, True),
        ("Seasonal vegetables", "all", "vegetable", 100, 50, 2.0, 10.0, 1.0, 1.0, 40, 20, 5, True),
        ("Roti-sabzi", "all", "mixed", 150, 210, 6.0, 25.0, 8.0, 1.0, 25, 25, 0, True),
        ("Rice-dal combo", "all", "mixed", 200, 250, 8.0, 40.0, 4.0, 1.5, 30, 20, 0, True),
    ]
    for (
        name, grp, fgroup, avg_g, kcal, prot, carb, fat, iron, ca, vit_a, vit_c, veg
    ) in data:
        _upsert_food(
            db,
            food_name=name,
            category_age_group=FoodAgeGroupEnum(grp),
            food_group=fgroup,
            avg_serving_g=float(avg_g) if avg_g is not None else None,
            energy_kcal=float(kcal) if kcal is not None else None,
            protein_g=float(prot) if prot is not None else None,
            carb_g=float(carb) if carb is not None else None,
            fat_g=float(fat) if fat is not None else None,
            iron_mg=float(iron) if iron is not None else None,
            calcium_mg=float(ca) if ca is not None else None,
            vitamin_a_mcg=float(vit_a) if vit_a is not None else None,
            vitamin_c_mg=float(vit_c) if vit_c is not None else None,
            is_veg=bool(veg),
        )
    return True

def normalize_all_text_fields(db: Session):
    """Clean up mojibake like '4û6 years' by normalizing unicode punctuation in existing rows.
    Updates VaccinationSchedule.vaccine_name, disease_prevented, recommended_age and
    ChildVaccineStatus.scheduled_text in place if changes are detected.
    """
    def _normalize(s: str) -> str:
        if s is None:
            return s
        return (
            s.replace('\u2013', '-')
             .replace('\u2014', '-')
             .replace('\u2212', '-')
             .replace('\u2011', '-')
             .replace('\u00A0', ' ')
        )

    # Normalize schedule fields
    schedules = db.query(VaccinationSchedule).all()
    sch_changed = 0
    for sch in schedules:
        changed = False
        new_name = _normalize(sch.vaccine_name)
        new_dis = _normalize(sch.disease_prevented)
        new_age = _normalize(sch.recommended_age)
        if new_name != sch.vaccine_name:
            sch.vaccine_name = new_name; changed = True
        if new_dis != sch.disease_prevented:
            sch.disease_prevented = new_dis; changed = True
        if new_age != sch.recommended_age:
            sch.recommended_age = new_age; changed = True
        if changed:
            sch_changed += 1
    # Normalize child status scheduled_text
    statuses = db.query(ChildVaccineStatus).all()
    st_changed = 0
    for st in statuses:
        new_sched = _normalize(st.scheduled_text)
        if new_sched != st.scheduled_text:
            st.scheduled_text = new_sched
            st_changed += 1
    if sch_changed or st_changed:
        db.commit()
    return {"schedules_updated": sch_changed, "statuses_updated": st_changed}

def seed_all_vaccination_schedules(db: Session):
    # Bulk dataset provided by user: (name, disease, recommended_age, doses, category, age_group)
    data = [
        # Infant
        ('BCG', 'Tuberculosis', 'At birth', 1, 'Core', 'Infant'),
        ('OPV - 0 dose', 'Poliomyelitis', 'At birth', 1, 'Core', 'Infant'),
        ('Hepatitis B - Birth Dose', 'Hepatitis B infection', 'At birth (within 24 hrs)', 1, 'Core', 'Infant'),
        ('Pentavalent Vaccine (DTP + Hib + Hep B)', 'Diphtheria, Tetanus, Pertussis, Hib, Hepatitis B', '6, 10, 14 weeks', 3, 'Core', 'Infant'),
        ('OPV - 1,2,3', 'Poliomyelitis', '6, 10, 14 weeks', 3, 'Core', 'Infant'),
        ('Rotavirus Vaccine', 'Rotavirus diarrhea', '6, 10, 14 weeks', 3, 'Optional', 'Infant'),
        ('IPV', 'Poliomyelitis', '14 weeks', 1, 'Core', 'Infant'),
        ('PCV', 'Pneumococcal infection', '6, 14 weeks', 2, 'Optional', 'Infant'),
        ('Influenza Vaccine', 'Influenza (flu)', '6 months onward (yearly)', 1, 'Optional', 'Infant'),
        ('MR Vaccine - 1st dose', 'Measles, Rubella', '9 months', 1, 'Core', 'Infant'),
        ('JE Vaccine', 'Japanese Encephalitis', '9 months (endemic areas)', 1, 'Regional', 'Infant'),
        ('Vitamin A Supplementation', 'Prevents deficiency & eye disorders', '9 months', 1, 'Supplemental', 'Infant'),
        # Toddler
        ('MR Vaccine - 2nd dose', 'Measles, Rubella', '15–18 months', 1, 'Core', 'Toddler'),
        ('DTP Booster - 1', 'Diphtheria, Tetanus, Pertussis', '15–18 months', 1, 'Core', 'Toddler'),
        ('OPV Booster', 'Poliomyelitis', '15–18 months', 1, 'Core', 'Toddler'),
        ('IPV Booster', 'Poliomyelitis', '15–18 months', 1, 'Core', 'Toddler'),
        ('PCV Booster', 'Pneumococcal infection', '15 months', 1, 'Optional', 'Toddler'),
        ('Varicella - 1st dose', 'Chickenpox', '15 months', 1, 'Optional', 'Toddler'),
        ('Hepatitis A - 1st dose', 'Hepatitis A', '12–23 months', 1, 'Optional', 'Toddler'),
        ('Influenza Vaccine', 'Influenza (flu)', 'Every year', 1, 'Optional', 'Toddler'),
        ('Vitamin A Supplementation', 'Vitamin A deficiency', 'Every 6 months until 5 years', 6, 'Supplemental', 'Toddler'),
        # PreSchool
        ('DTP Booster - 2', 'Diphtheria, Tetanus, Pertussis', '4–6 years', 1, 'Core', 'PreSchool'),
        ('OPV Booster', 'Poliomyelitis', '4–6 years', 1, 'Core', 'PreSchool'),
        ('Varicella - 2nd dose', 'Chickenpox', '4–6 years', 1, 'Optional', 'PreSchool'),
        ('MMR Booster', 'Measles, Mumps, Rubella', '4–6 years', 1, 'Core', 'PreSchool'),
        ('Typhoid Conjugate Vaccine', 'Typhoid fever', '2 years onward (single dose)', 1, 'Optional', 'PreSchool'),
        ('Hepatitis A - 2nd dose', 'Hepatitis A', '6–18 months after 1st dose', 1, 'Optional', 'PreSchool'),
        ('Influenza Vaccine', 'Influenza (flu)', 'Every year', 1, 'Optional', 'PreSchool'),
        ('Vitamin A Supplementation', 'Prevent deficiency', 'Every 6 months until 5 years', 4, 'Supplemental', 'PreSchool'),
        # SchoolAge
        ('Typhoid Booster', 'Typhoid fever', '6–10 years', 1, 'Optional', 'SchoolAge'),
        ('Influenza Vaccine', 'Influenza (flu)', 'Every year', 1, 'Optional', 'SchoolAge'),
        ('Td / DT Booster', 'Tetanus and Diphtheria', '10 years', 1, 'Core', 'SchoolAge'),
        ('HPV Vaccine', 'Human Papillomavirus (Cervical cancer prevention)', '9–10 years', 2, 'Optional', 'SchoolAge'),
        ('Vitamin A Supplementation', 'Nutritional support', 'Continue if under 10 years', 2, 'Supplemental', 'SchoolAge'),
    ]

    # Mapping helpers
    cat_map = {
        'Core': VaccineCategoryEnum.CORE,
        'Optional': VaccineCategoryEnum.OPTIONAL,
        'Regional': VaccineCategoryEnum.REGIONAL,
        'Supplemental': VaccineCategoryEnum.SUPPLEMENTAL,
    }
    grp_map = {
        'Infant': VaccinationAgeGroupEnum.INFANT,
        'Toddler': VaccinationAgeGroupEnum.TODDLER,
        'PreSchool': VaccinationAgeGroupEnum.PRESCHOOL,  # normalize
        'Preschool': VaccinationAgeGroupEnum.PRESCHOOL,
        'SchoolAge': VaccinationAgeGroupEnum.SCHOOL_AGE,
    }

    for name, disease, age_text, doses, cat_str, grp_str in data:
        _upsert_schedule_row(
            db,
            name=name,
            disease=disease,
            age_text=age_text,
            doses=doses,
            category=cat_map[cat_str],
            group=grp_map[grp_str],
        )

def list_schedule_by_age_group(db: Session, age_group: VaccinationAgeGroupEnum):
    return (
        db.query(VaccinationSchedule)
        .filter(VaccinationSchedule.age_group == age_group)
        .order_by(VaccinationSchedule.id.asc())
        .all()
    )

def initialize_child_vaccine_statuses_for_group(db: Session, child_id: int, age_group: VaccinationAgeGroupEnum):
    schedules = list_schedule_by_age_group(db, age_group)
    created: list[ChildVaccineStatus] = []
    for s in schedules:
        for dose in range(1, (s.doses_required or 1) + 1):
            exists = (
                db.query(ChildVaccineStatus)
                .filter(
                    ChildVaccineStatus.child_id == child_id,
                    ChildVaccineStatus.schedule_id == s.id,
                    ChildVaccineStatus.dose_number == dose,
                )
                .first()
            )
            if exists:
                continue
            cvs = ChildVaccineStatus(
                child_id=child_id,
                schedule_id=s.id,
                dose_number=dose,
                status=VaccineStatusEnum.PENDING,
                scheduled_text=s.recommended_age,
                scheduled_date=None,
            )
            db.add(cvs)
            created.append(cvs)
    db.commit()
    # refresh to get IDs
    for item in created:
        db.refresh(item)
    return created

def list_child_vaccine_statuses_by_group(db: Session, child_id: int, age_group: VaccinationAgeGroupEnum):
    # join with schedule to filter by age_group
    return (
        db.query(ChildVaccineStatus)
        .join(VaccinationSchedule, VaccinationSchedule.id == ChildVaccineStatus.schedule_id)
        .filter(
            ChildVaccineStatus.child_id == child_id,
            VaccinationSchedule.age_group == age_group,
        )
        .order_by(ChildVaccineStatus.schedule_id.asc(), ChildVaccineStatus.dose_number.asc())
        .all()
    )

def get_child_vaccine_status(db: Session, status_id: int):
    return db.query(ChildVaccineStatus).filter(ChildVaccineStatus.id == status_id).first()

def update_child_vaccine_status(db: Session, db_status: ChildVaccineStatus, updates: ChildVaccineStatusUpdate):
    if updates.status is not None:
        db_status.status = updates.status
    if updates.scheduled_date is not None:
        db_status.scheduled_date = updates.scheduled_date
    if updates.actual_date is not None:
        db_status.actual_date = updates.actual_date
    if updates.notes is not None:
        db_status.notes = updates.notes
    if updates.side_effects is not None:
        db_status.side_effects = updates.side_effects
    db.commit()
    db.refresh(db_status)
    return db_status

def get_schedule_by_id(db: Session, schedule_id: int) -> Optional[VaccinationSchedule]:
    return db.query(VaccinationSchedule).filter(VaccinationSchedule.id == schedule_id).first()

def record_vaccine_given(
    db: Session,
    *,
    child_id: int,
    schedule_id: int,
    dose_number: int,
    given_date: date,
    side_effects: Optional[str] = None,
    notes: Optional[str] = None,
) -> ChildVaccineStatus:
    # Ensure schedule exists
    schedule = get_schedule_by_id(db, schedule_id)
    if not schedule:
        raise ValueError("Schedule not found")
    # Compute next dose number as 1 + max existing dose_number for this child+schedule
    from sqlalchemy import func as _func
    max_dose = (
        db.query(_func.coalesce(_func.max(ChildVaccineStatus.dose_number), 0))
        .filter(
            ChildVaccineStatus.child_id == child_id,
            ChildVaccineStatus.schedule_id == schedule_id,
        )
        .scalar()
    )
    next_dose = int(max_dose) + 1
    # Validate next dose is within total required
    if next_dose < 1:
        raise ValueError("Computed dose number invalid")
    if schedule.doses_required is not None and next_dose > schedule.doses_required:
        raise ValueError(
            f"All doses already recorded for this vaccine (requires {schedule.doses_required})"
        )

    # Always create a new row for the next dose (do not update existing rows)
    new_row = ChildVaccineStatus(
        child_id=child_id,
        schedule_id=schedule_id,
        dose_number=next_dose,
        status=VaccineStatusEnum.COMPLETED,
        scheduled_text=schedule.recommended_age,
        actual_date=given_date,
        side_effects=side_effects,
        notes=notes,
    )
    db.add(new_row)
    db.commit()
    db.refresh(new_row)
    return new_row

# Utility: compute a child's age group
def compute_child_age_group(dob: date) -> VaccinationAgeGroupEnum:
    today = date.today()
    years = (today - dob).days / 365.25
    if years < 1:
        return VaccinationAgeGroupEnum.INFANT
    elif years < 4:
        return VaccinationAgeGroupEnum.TODDLER
    elif years <= 6:
        return VaccinationAgeGroupEnum.PRESCHOOL
    else:
        return VaccinationAgeGroupEnum.SCHOOL_AGE

# -------------------- Milestones --------------------
def _upsert_milestone(
    db: Session,
    *,
    category: VaccinationAgeGroupEnum,
    code: str,
    name: str,
    s1: str | None,
    s2: str | None,
    s3: str | None,
):
    existing = db.query(ChildMilestone).filter(ChildMilestone.milestone_code == code).first()
    if existing:
        changed = False
        if existing.category != category:
            existing.category = category; changed = True
        if existing.milestone_name != name:
            existing.milestone_name = name; changed = True
        if existing.sub_feature_1 != s1:
            existing.sub_feature_1 = s1; changed = True
        if existing.sub_feature_2 != s2:
            existing.sub_feature_2 = s2; changed = True
        if existing.sub_feature_3 != s3:
            existing.sub_feature_3 = s3; changed = True
        if changed:
            db.commit(); db.refresh(existing)
        return existing
    row = ChildMilestone(
        category=category,
        milestone_code=code,
        milestone_name=name,
        sub_feature_1=s1,
        sub_feature_2=s2,
        sub_feature_3=s3,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def seed_all_child_milestones(db: Session):
    data = [
        # Infant
        ('Infant', 'milestone_smile', 'Social Smile', 'Eye contact', 'Social smile', 'Responds to faces'),
        ('Infant', 'milestone_roll', 'Rolling Over', 'Rolls front-to-back', 'Rolls both sides', 'Pushes up on tummy'),
        ('Infant', 'milestone_sit', 'Sitting', 'Sits with support', 'Sits without support', 'Reaches while sitting'),
        # Toddler
        ('Toddler', 'milestones_language', 'Language Development', 'Says single words', 'Understands simple commands', 'Combines 2 words'),
        ('Toddler', 'milestones_walking', 'Walking', 'Stands alone', 'Takes few steps', 'Walks steadily'),
        # Preschool
        ('Preschool', 'milestone_speech_clarity', 'Speech Clarity', 'Speaks clearly', 'Forms full sentences', 'Uses correct words'),
        ('Preschool', 'milestone_social_play', 'Social Play', 'Plays with peers', 'Shares toys', 'Follows group rules'),
        # School Age
        ('SchoolAge', 'milestone_learning_skill', 'Learning Skill', 'Reads simple stories', 'Solves basic math', 'Pays attention in class'),
        ('SchoolAge', 'milestone_social_skill', 'Social Skill', 'Makes friends', 'Works in teams', 'Shows empathy'),
    ]

    grp_map = {
        'Infant': VaccinationAgeGroupEnum.INFANT,
        'Toddler': VaccinationAgeGroupEnum.TODDLER,
        'Preschool': VaccinationAgeGroupEnum.PRESCHOOL,
        'SchoolAge': VaccinationAgeGroupEnum.SCHOOL_AGE,
    }

    for grp, code, name, s1, s2, s3 in data:
        _upsert_milestone(
            db,
            category=grp_map[grp],
            code=code,
            name=name,
            s1=s1,
            s2=s2,
            s3=s3,
        )

def list_milestones_by_age_group(db: Session, age_group: VaccinationAgeGroupEnum):
    return (
        db.query(ChildMilestone)
        .filter(ChildMilestone.category == age_group)
        .order_by(ChildMilestone.id.asc())
        .all()
    )

def list_child_milestones_for_child(db: Session, *, child: Child):
    group = compute_child_age_group(child.date_of_birth)
    return list_milestones_by_age_group(db, group)

# -------------------- Child Milestone Status CRUD --------------------
def get_child_milestone_status(db: Session, *, child_id: int, milestone_id: int):
    return (
        db.query(ChildMilestoneStatus)
        .filter(
            ChildMilestoneStatus.child_id == child_id,
            ChildMilestoneStatus.milestone_id == milestone_id,
        )
        .first()
    )

def upsert_child_milestone_status(db: Session, *, payload: ChildMilestoneStatusCreate):
    row = get_child_milestone_status(db, child_id=payload.child_id, milestone_id=payload.milestone_id)
    if row:
        # If already archived (has achieved_date), do not allow overwrites
        if row.achieved_date is not None:
            raise ValueError("Milestone already archived; cannot overwrite")
        changed = False
        if getattr(payload, 'achieved_date', None) is not None and row.achieved_date != payload.achieved_date:
            row.achieved_date = payload.achieved_date; changed = True
        if getattr(payload, 'difficulty', None) is not None and row.difficulty != payload.difficulty:
            row.difficulty = payload.difficulty; changed = True
        if getattr(payload, 'special_milestone', None) is not None and row.special_milestone != payload.special_milestone:
            row.special_milestone = payload.special_milestone; changed = True
        if changed:
            db.commit(); db.refresh(row)
        return row
    new_row = ChildMilestoneStatus(
        child_id=payload.child_id,
        milestone_id=payload.milestone_id,
        achieved_date=payload.achieved_date,
        difficulty=payload.difficulty,
        special_milestone=payload.special_milestone,
    )
    db.add(new_row)
    db.commit()
    db.refresh(new_row)
    return new_row

def list_child_milestone_statuses(db: Session, *, child_id: int):
    return (
        db.query(ChildMilestoneStatus)
        .filter(ChildMilestoneStatus.child_id == child_id)
        .order_by(ChildMilestoneStatus.milestone_id.asc())
        .all()
    )

def ensure_status_rows_for_child_group(db: Session, *, child: Child):
    """Ensure a ChildMilestoneStatus exists for each milestone in the child's current age group.
    Does not modify existing rows.
    """
    group = compute_child_age_group(child.date_of_birth)
    milestones = list_milestones_by_age_group(db, group)
    created = 0
    for m in milestones:
        exists = get_child_milestone_status(db, child_id=child.child_id, milestone_id=m.id)
        if exists:
            continue
        # create empty status row with defaults
        row = ChildMilestoneStatus(
            child_id=child.child_id,
            milestone_id=m.id,
            achieved_date=None,
            difficulty=None,
            special_milestone=False,
        )
        db.add(row)
        created += 1
    if created:
        db.commit()
    # return full list after ensuring
    return list_child_milestone_statuses(db, child_id=child.child_id)

def list_child_milestone_statuses_by_group(db: Session, *, child_id: int, age_group: VaccinationAgeGroupEnum):
    return (
        db.query(ChildMilestoneStatus)
        .join(ChildMilestone, ChildMilestone.id == ChildMilestoneStatus.milestone_id)
        .filter(
            ChildMilestoneStatus.child_id == child_id,
            ChildMilestone.category == age_group,
        )
        .order_by(ChildMilestoneStatus.milestone_id.asc())
        .all()
    )

# -------------------- Illness Logs --------------------
def create_child_illness_log(db: Session, child_id: int, payload: ChildIllnessLogCreate) -> ChildIllnessLog:
    row = ChildIllnessLog(
        child_id=child_id,
        fever=payload.fever,
        cold=payload.cold,
        cough=payload.cough,
        sore_throat=payload.sore_throat,
        headache=payload.headache,
        stomach_ache=payload.stomach_ache,
        nausea=payload.nausea,
        vomiting=payload.vomiting,
        diarrhea=payload.diarrhea,
        rash=payload.rash,
        fatigue=payload.fatigue,
        loss_of_appetite=payload.loss_of_appetite,
        temperature_c=payload.temperature_c,
        temperature_time=payload.temperature_time,
        symptom_start_date=payload.symptom_start_date,
        severity=payload.severity,
        is_current=payload.is_current,
        resolved_on=payload.resolved_on,
        notes=payload.notes,
    )
    # Allow resolved_by only when creating a non-current (already resolved) log
    if row.is_current:
        row.resolved_by = None
    else:
        # use payload.resolved_by if provided; else default to Parent
        if hasattr(payload, 'resolved_by') and payload.resolved_by is not None:
            row.resolved_by = payload.resolved_by
        else:
            from app.schemas.schemas import ResolvedByEnum
            row.resolved_by = ResolvedByEnum.PARENT
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def get_child_illness_log_by_id(db: Session, *, log_id: int) -> Optional[ChildIllnessLog]:
    return db.query(ChildIllnessLog).filter(ChildIllnessLog.id == log_id).first()

def list_child_illness_logs(
    db: Session,
    *,
    child_id: int,
    status: Literal['current', 'resolved', 'history', 'all'] = 'all',
) -> _List[ChildIllnessLog]:
    q = db.query(ChildIllnessLog).filter(ChildIllnessLog.child_id == child_id)
    if status == 'current':
        q = q.filter(ChildIllnessLog.is_current == True)
    elif status == 'resolved':
        q = q.filter(ChildIllnessLog.resolved_on.isnot(None))
    elif status == 'history':
        q = q.filter(ChildIllnessLog.is_current == False)
    return q.order_by(ChildIllnessLog.created_at.desc()).all()

def update_child_illness_log(db: Session, *, row: ChildIllnessLog, updates: ChildIllnessLogUpdate) -> ChildIllnessLog:
    for field in (
        'fever','cold','cough','sore_throat','headache','stomach_ache','nausea','vomiting','diarrhea','rash','fatigue','loss_of_appetite',
        'temperature_c','temperature_time','symptom_start_date','severity','is_current','resolved_on','resolved_by','notes'
    ):
        value = getattr(updates, field, None)
        if value is not None:
            setattr(row, field, value)
    db.commit(); db.refresh(row)
    return row

def resolve_child_illness_log(db: Session, *, row: ChildIllnessLog, req: ResolveIllnessLogRequest) -> ChildIllnessLog:
    row.is_current = False
    if getattr(req, 'resolved_on', None) is not None:
        row.resolved_on = req.resolved_on
    if getattr(req, 'resolved_by', None) is not None:
        row.resolved_by = req.resolved_by
    db.commit(); db.refresh(row)
    return row

from app.models.models import NutritionRequirement

def seed_nutrition_requirements(db: Session):
    data = [
        # age_min_months, age_max_months,
        # energy_kcal, protein_g, carb_g, fat_g,
        # iron_mg, calcium_mg, vitamin_a_mcg, vitamin_c_mg

        # Infants (0–5 months) – exclusive milk
        (0, 5, 550.0, 9.1, 0.0, 31.0, 0.27, 200.0, 400.0, 40.0),

        # Infants (6–11 months) – complementary feeding starts
        (6, 11, 700.0, 11.0, 0.0, 30.0, 11.0, 260.0, 500.0, 50.0),

        # Toddlers (1–2 years)
        (12, 23, 900.0, 11.0, 120.0, 30.0, 7.0, 500.0, 300.0, 20.0),

        # Toddlers (2–3 years)
        (24, 35, 1000.0, 13.0, 130.0, 30.0, 7.0, 600.0, 300.0, 20.0),

        # Early childhood (3–4 years)
        (36, 47, 1200.0, 16.0, 140.0, 32.0, 9.0, 600.0, 350.0, 25.0),

        # Preschool (4–6 years)
        (48, 71, 1350.0, 20.0, 150.0, 35.0, 10.0, 650.0, 400.0, 25.0),

        # Early school age (6–7 years)
        (72, 83, 1550.0, 24.0, 165.0, 38.0, 11.0, 700.0, 500.0, 30.0),

        # School age (7–10 years)
        (84, 120, 1700.0, 29.0, 180.0, 40.0, 12.0, 800.0, 600.0, 30.0),
    ]



    for (
        age_min,
        age_max,
        energy,
        protein,
        carb,
        fat,
        iron,
        calcium,
        vit_a,
        vit_c,
    ) in data:
        existing = (
            db.query(NutritionRequirement)
            .filter(
                NutritionRequirement.age_min_months == age_min,
                NutritionRequirement.age_max_months == age_max,
            )
            .first()
        )
        if existing:
            changed = False
            if existing.energy_kcal != energy:
                existing.energy_kcal = energy; changed = True
            if existing.protein_g != protein:
                existing.protein_g = protein; changed = True
            if existing.carb_g != carb:
                existing.carb_g = carb; changed = True
            if existing.fat_g != fat:
                existing.fat_g = fat; changed = True
            if existing.iron_mg != iron:
                existing.iron_mg = iron; changed = True
            if existing.calcium_mg != calcium:
                existing.calcium_mg = calcium; changed = True
            if existing.vitamin_a_mcg != vit_a:
                existing.vitamin_a_mcg = vit_a; changed = True
            if existing.vitamin_c_mg != vit_c:
                existing.vitamin_c_mg = vit_c; changed = True
            if changed:
                db.commit(); db.refresh(existing)
            continue

        row = NutritionRequirement(
            age_min_months=age_min,
            age_max_months=age_max,
            energy_kcal=energy,
            protein_g=protein,
            carb_g=carb,
            fat_g=fat,
            iron_mg=iron,
            calcium_mg=calcium,
            vitamin_a_mcg=vit_a,
            vitamin_c_mg=vit_c,
        )
        db.add(row)

    db.commit()
    return True
