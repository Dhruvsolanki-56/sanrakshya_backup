from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func, Enum, Date, ForeignKey, Boolean, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.schemas.schemas import VaccineCategoryEnum, VaccineStatusEnum, VaccinationAgeGroupEnum
from app.schemas.schemas import AchievedDifficultyEnum
from app.schemas.schemas import IllnessSeverityEnum, ResolvedByEnum
from app.schemas.schemas import FoodAgeGroupEnum
from app.schemas.schemas import MealTypeEnum
from app.schemas.schemas import ReportTypeEnum

class ChildMedicalReport(Base):
    __tablename__ = "child_medical_reports"

    report_id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)

    report_type = Column(Enum(ReportTypeEnum, name="report_type_enum"), nullable=False, index=True)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    mime_type = Column(String(100), nullable=False)

    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(255), nullable=False)

    # Envelope encryption metadata: encrypted per-file DEK and nonces used for AES-256-GCM.
    encrypted_dek = Column(Text, nullable=False)
    dek_nonce = Column(String(64), nullable=False)
    file_nonce = Column(String(64), nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)


class ParentProfilePhoto(Base):
    __tablename__ = "parent_profile_photos"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.parent_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    photo_url = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)


class ChildProfilePhoto(Base):
    __tablename__ = "child_profile_photos"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    photo_url = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)


class ChildAnthropometry(Base):
    __tablename__ = "child_anthropometry"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, nullable=False)

    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    muac_cm = Column(Float, nullable=True)
    avg_sleep_hours_per_day = Column(Float, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChildMealLog(Base):
    __tablename__ = "child_meal_log"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    items = relationship("ChildMealItem", primaryjoin="ChildMealLog.id==ChildMealItem.meal_log_id", lazy="joined")

class ChildMealItem(Base):
    __tablename__ = "child_meal_item"

    id = Column(Integer, primary_key=True, index=True)
    meal_log_id = Column(Integer, ForeignKey("child_meal_log.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_type = Column(Enum(MealTypeEnum, name="meal_type_enum"), nullable=False)
    food_id = Column(Integer, ForeignKey("food_master.food_id"), nullable=True, index=True)
    custom_food_name = Column(String(100), nullable=True)
    serving_size_g = Column(Float, nullable=False)
    meal_frequency = Column(Integer, nullable=False, server_default='1')
    is_ai_estimated = Column(Boolean, nullable=False, server_default='0')
    energy_kcal = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    carb_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    iron_mg = Column(Float, nullable=True)
    calcium_mg = Column(Float, nullable=True)
    vitamin_a_mcg = Column(Float, nullable=True)
    vitamin_c_mg = Column(Float, nullable=True)


class FoodMaster(Base):
    __tablename__ = "food_master"

    food_id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String(100), nullable=False, index=True)
    category_age_group = Column(Enum(FoodAgeGroupEnum, name="food_age_group_enum"), nullable=False, index=True)
    food_group = Column(String(30), nullable=True)
    avg_serving_g = Column(Float, nullable=True)
    energy_kcal = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    carb_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    iron_mg = Column(Float, nullable=True)
    calcium_mg = Column(Float, nullable=True)
    vitamin_a_mcg = Column(Float, nullable=True)
    vitamin_c_mg = Column(Float, nullable=True)
    is_veg = Column(Boolean, nullable=False, server_default='1')
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChildIllnessLog(Base):
    __tablename__ = "child_illness_logs"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)

    fever = Column(Boolean, nullable=False, server_default='false')
    cold = Column(Boolean, nullable=False, server_default='false')
    cough = Column(Boolean, nullable=False, server_default='false')
    sore_throat = Column(Boolean, nullable=False, server_default='false')
    headache = Column(Boolean, nullable=False, server_default='false')
    stomach_ache = Column(Boolean, nullable=False, server_default='false')
    nausea = Column(Boolean, nullable=False, server_default='false')
    vomiting = Column(Boolean, nullable=False, server_default='false')
    diarrhea = Column(Boolean, nullable=False, server_default='false')
    rash = Column(Boolean, nullable=False, server_default='false')
    fatigue = Column(Boolean, nullable=False, server_default='false')
    loss_of_appetite = Column(Boolean, nullable=False, server_default='false')

    temperature_c = Column(Float, nullable=True)
    temperature_time = Column(TIMESTAMP, nullable=True)

    symptom_start_date = Column(TIMESTAMP, nullable=True)
    severity = Column(Enum(IllnessSeverityEnum, name="illness_severity_enum"), nullable=True)
    is_current = Column(Boolean, nullable=False, server_default='true')
    resolved_on = Column(TIMESTAMP, nullable=True)
    resolved_by = Column(Enum(ResolvedByEnum, name="resolved_by_enum"), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChildMilestoneStatus(Base):
    __tablename__ = "child_milestone_status"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_id = Column(Integer, ForeignKey("child_milestones.id", ondelete="CASCADE"), nullable=False, index=True)
    achieved_date = Column(Date, nullable=True)
    difficulty = Column(Enum(AchievedDifficultyEnum, name="achieved_difficulty_enum"), nullable=True)
    special_milestone = Column(Boolean, nullable=False, server_default='false')
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    # Eagerly load milestone details for API composition
    milestone = relationship("ChildMilestone", primaryjoin="ChildMilestoneStatus.milestone_id==ChildMilestone.id", lazy="joined")
    __table_args__ = (
        UniqueConstraint('child_id', 'milestone_id', name='uq_child_milestone_status_child_milestone'),
        {
            'sqlite_autoincrement': True,
        },
    )

class VaccinationSchedule(Base):
    __tablename__ = "vaccination_schedule"

    id = Column(Integer, primary_key=True, index=True)
    vaccine_name = Column(String(100), nullable=False, index=True)
    disease_prevented = Column(String(200), nullable=False)
    recommended_age = Column(String(100), nullable=False)
    doses_required = Column(Integer, nullable=False)
    category = Column(Enum(VaccineCategoryEnum, name="vaccine_category_enum"), nullable=False)
    age_group = Column(Enum(VaccinationAgeGroupEnum, name="vaccination_age_group_enum"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChildVaccineStatus(Base):
    __tablename__ = "child_vaccine_status"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("vaccination_schedule.id", ondelete="CASCADE"), nullable=False, index=True)
    dose_number = Column(Integer, nullable=False)
    status = Column(Enum(VaccineStatusEnum, name="vaccine_status_enum"), nullable=False)
    scheduled_text = Column(String(100), nullable=True)
    scheduled_date = Column(Date, nullable=True)
    actual_date = Column(Date, nullable=True)
    notes = Column(String(250), nullable=True)
    side_effects = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    # Relationship to access schedule details
    schedule = relationship("VaccinationSchedule", primaryjoin="ChildVaccineStatus.schedule_id==VaccinationSchedule.id", lazy="joined")

class Parent(Base):
    __tablename__ = "parents"

    parent_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone_number = Column(String(15), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default='1')
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class Child(Base):
    __tablename__ = "children"

    child_id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.parent_id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(5), nullable=True)
    date_of_birth = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChildMilestone(Base):
    __tablename__ = "child_milestones"

    id = Column(Integer, primary_key=True, index=True)
    # Use the same enum as vaccination age groups for category consistency
    category = Column(Enum(VaccinationAgeGroupEnum, name="vaccination_age_group_enum"), nullable=False, index=True)
    milestone_code = Column(String(100), nullable=False, unique=True, index=True)
    milestone_name = Column(String(150), nullable=False)
    sub_feature_1 = Column(String(150), nullable=True)
    sub_feature_2 = Column(String(150), nullable=True)
    sub_feature_3 = Column(String(150), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChildPredictionReport(Base):
    __tablename__ = "child_prediction_reports"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, index=True)
    age_group = Column(Enum(VaccinationAgeGroupEnum, name="vaccination_age_group_enum"), nullable=False, index=True)

    # When the prediction was generated
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Core shared input features (union across age groups)
    is_existing = Column(Integer, nullable=True)
    age_days = Column(Integer, nullable=True)
    age_months = Column(Integer, nullable=True)
    age_years = Column(Integer, nullable=True)
    sex = Column(Integer, nullable=True)

    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    muac_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    weight_zscore = Column(Float, nullable=True)
    height_zscore = Column(Float, nullable=True)

    feeding_type = Column(Integer, nullable=True)
    feeding_frequency = Column(Integer, nullable=True)
    vaccination_status = Column(Integer, nullable=True)
    sleep_hours = Column(Float, nullable=True)

    illness_fever = Column(Integer, nullable=True)
    illness_cold = Column(Integer, nullable=True)
    illness_diarrhea = Column(Integer, nullable=True)

    # Milestone presence flags across groups
    milestone_smile = Column(Integer, nullable=True)
    milestone_roll = Column(Integer, nullable=True)
    milestone_sit = Column(Integer, nullable=True)
    milestones_language = Column(Integer, nullable=True)
    milestones_walking = Column(Integer, nullable=True)
    milestone_speech_clarity = Column(Integer, nullable=True)
    milestone_social_play = Column(Integer, nullable=True)
    milestone_learning_skill = Column(Integer, nullable=True)
    milestone_social_skill = Column(Integer, nullable=True)

    avg_weight_gain = Column(Float, nullable=True)
    weight_velocity = Column(Float, nullable=True)
    illness_freq_trend = Column(Float, nullable=True)

    # Model outputs / targets (union across all age groups)
    growth_percentile = Column(Float, nullable=True)
    nutrition_flag = Column(Integer, nullable=True)
    prob_fever = Column(Float, nullable=True)
    prob_cold = Column(Float, nullable=True)
    prob_diarrhea = Column(Float, nullable=True)

    milestone_sit_delay_prob = Column(Float, nullable=True)
    milestones_language_delay_prob = Column(Float, nullable=True)
    milestones_walking_delay_prob = Column(Float, nullable=True)
    milestone_speech_delay_prob = Column(Float, nullable=True)
    milestone_social_play_delay_prob = Column(Float, nullable=True)
    milestone_learning_delay_prob = Column(Float, nullable=True)
    milestone_social_skill_delay_prob = Column(Float, nullable=True)

class NutritionRequirement(Base):
    __tablename__ = "nutrition_requirement"

    id = Column(Integer, primary_key=True, index=True)
    age_min_months = Column(Integer, nullable=False)
    age_max_months = Column(Integer, nullable=False)
    energy_kcal = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carb_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    iron_mg = Column(Float, nullable=False)
    calcium_mg = Column(Float, nullable=False)
    vitamin_a_mcg = Column(Float, nullable=False)
    vitamin_c_mg = Column(Float, nullable=False)

class NutritionRecipe(Base):
    __tablename__ = "nutrition_recipe"

    id = Column(Integer, primary_key=True, index=True)
    # Age band for which this recipe is recommended
    age_min_months = Column(Integer, nullable=False, index=True)
    age_max_months = Column(Integer, nullable=False, index=True)

    # Stable external identifier (from provided JSON)
    recipe_code = Column(String(100), unique=True, nullable=False, index=True)

    recipe_name = Column(String(200), nullable=False)
    veg_nonveg = Column(String(20), nullable=True)

    primary_nutrient = Column(String(50), nullable=True)
    secondary_nutrients = Column(Text, nullable=True)  # comma-separated list

    energy_density = Column(String(30), nullable=True)
    meal_type = Column(String(50), nullable=True)
    texture = Column(String(50), nullable=True)

    ingredients = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)

    prep_time_mins = Column(Integer, nullable=True)
    youtube_url = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
