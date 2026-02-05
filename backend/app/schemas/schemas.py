from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# Vaccination age group enum - defined early as it's used in multiple places
class VaccinationAgeGroupEnum(str, Enum):
    INFANT = 'Infant'
    TODDLER = 'Toddler'
    PRESCHOOL = 'Preschool'
    SCHOOL_AGE = 'SchoolAge'

class ReportTypeEnum(str, Enum):
    PRESCRIPTION = 'Prescription'
    LAB_REPORT = 'LabReport'
    VACCINATION_RECORD = 'VaccinationRecord'
    DISCHARGE_SUMMARY = 'DischargeSummary'
    IMAGING_SCAN = 'ImagingScan'
    OTHER = 'Other'

# Regex for phone number validation
phone_number_regex = r"^\+?[0-9]{10,15}$"


class PredictionDataframe(BaseModel):
    columns: List[str]
    values: List[List[Any]]


class ChildPredictionResponse(BaseModel):
    age_group: str
    is_existing: bool
    required_missing: List[str]
    report_id: Optional[int] = None
    status: str
    created_at: Optional[datetime] = None


class ChildPredictionReportBase(BaseModel):
    id: int
    child_id: int
    age_group: VaccinationAgeGroupEnum
    created_at: datetime
    # Core anthropometry and derived metrics
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    muac_cm: Optional[float] = None
    sleep_hours: Optional[float] = None
    bmi: Optional[float] = None
    weight_zscore: Optional[float] = None
    height_zscore: Optional[float] = None
    weight_zscore_flag: Optional[str] = None
    height_zscore_flag: Optional[str] = None

    # Feeding and illness summary
    avg_weight_gain: Optional[float] = None
    weight_velocity: Optional[float] = None
    feeding_type: Optional[int] = None
    feeding_frequency: Optional[int] = None
    vaccination_status: Optional[int] = None
    feeding_type_label: Optional[str] = None
    vaccination_status_label: Optional[str] = None
    illness_fever: Optional[int] = None
    illness_cold: Optional[int] = None
    illness_diarrhea: Optional[int] = None

    # Key prediction outputs
    growth_percentile: Optional[float] = None
    nutrition_flag: Optional[int] = None
    nutrition_flag_label: Optional[str] = None
    prob_fever: Optional[float] = None
    prob_cold: Optional[float] = None
    prob_diarrhea: Optional[float] = None
    fever_risk_flag: Optional[str] = None
    cold_risk_flag: Optional[str] = None
    diarrhea_risk_flag: Optional[str] = None

    milestone_sit_delay_prob: Optional[float] = None
    milestones_language_delay_prob: Optional[float] = None
    milestones_walking_delay_prob: Optional[float] = None
    milestone_speech_delay_prob: Optional[float] = None
    milestone_social_play_delay_prob: Optional[float] = None
    milestone_learning_delay_prob: Optional[float] = None
    milestone_social_skill_delay_prob: Optional[float] = None
    milestone_sit_delay_flag: Optional[str] = None
    milestones_language_delay_flag: Optional[str] = None
    milestones_walking_delay_flag: Optional[str] = None
    milestone_speech_delay_flag: Optional[str] = None
    milestone_social_play_delay_flag: Optional[str] = None
    milestone_learning_delay_flag: Optional[str] = None
    milestone_social_skill_delay_flag: Optional[str] = None

    class Config:
        from_attributes = True


class ChildPredictionTrendPoint(BaseModel):
    id: int
    created_at: datetime
    age_group: VaccinationAgeGroupEnum
    age_days: Optional[int] = None
    age_months: Optional[int] = None
    age_years: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    growth_percentile: Optional[float] = None
    nutrition_flag: Optional[int] = None





class ParentBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone_number: str = Field(..., pattern=phone_number_regex)

class ParentCreate(ParentBase):
    password: str = Field(..., min_length=8, max_length=50)

class ParentUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=phone_number_regex)

class ParentInDBBase(ParentBase):
    parent_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Parent(ParentInDBBase):
    pass

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime

class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None # 'doctor' or 'parent'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Child related
class GenderEnum(str, Enum):
    MALE = 'Male'
    FEMALE = 'Female'
    OTHER = 'Other'

class BloodGroupEnum(str, Enum):
    A_POS = 'A+'
    A_NEG = 'A-'
    B_POS = 'B+'
    B_NEG = 'B-'
    AB_POS = 'AB+'
    AB_NEG = 'AB-'
    O_POS = 'O+'
    O_NEG = 'O-'

class ChildBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: Optional[GenderEnum] = None
    blood_group: Optional[BloodGroupEnum] = None

    @field_validator('date_of_birth')
    @classmethod
    def dob_not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('date_of_birth cannot be in the future')
        return v

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    blood_group: Optional[BloodGroupEnum] = None

    @field_validator('date_of_birth')
    @classmethod
    def dob_not_in_future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError('date_of_birth cannot be in the future')
        return v

class ChildInDBBase(ChildBase):
    child_id: int
    parent_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Child(ChildInDBBase):
    pass

# Composed schemas for responses
class ParentWithChildren(ParentInDBBase):
    children: List[Child] = Field(default_factory=list)

class UserHome(BaseModel):
    pass


class ParentHomeChildSummary(BaseModel):
    child_id: int
    name: str
    age_years: int
    age_months: int
    photo_url: Optional[str] = None
    gender: Optional[GenderEnum] = None
    blood_group: Optional[BloodGroupEnum] = None
    growth_dev_progress_percent: Optional[float] = None
    growth_dev_progress_label: Optional[str] = None
    vaccination_status: Optional[str] = None
    next_vaccine_name: Optional[str] = None
    next_vaccine_recommended_age: Optional[str] = None
    illness_alerts: Dict[str, Any] = Field(default_factory=dict)
    nutrition_status: Optional[str] = None
    risk_level: Optional[str] = None


class ParentHomeSummary(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    parent_photo_url: Optional[str] = None
    children: List[ParentHomeChildSummary] = Field(default_factory=list)


class ParentProfile(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str

# Vaccination related
class VaccineCategoryEnum(str, Enum):
    CORE = 'Core'
    OPTIONAL = 'Optional'
    REGIONAL = 'Regional'
    SUPPLEMENTAL = 'Supplemental'

class VaccineStatusEnum(str, Enum):
    PENDING = 'Pending'
    COMPLETED = 'Completed'
    MISSED = 'Missed'

class VaccinationScheduleBase(BaseModel):
    vaccine_name: str = Field(..., max_length=100)
    disease_prevented: str = Field(..., max_length=200)
    recommended_age: str = Field(..., max_length=100)
    doses_required: int = Field(..., ge=1, le=20)
    category: VaccineCategoryEnum
    age_group: VaccinationAgeGroupEnum

class VaccinationScheduleCreate(VaccinationScheduleBase):
    pass

class VaccinationSchedule(VaccinationScheduleBase):
    id: int

    class Config:
        from_attributes = True

class ChildVaccineStatusBase(BaseModel):
    child_id: int
    schedule_id: int
    dose_number: int = Field(..., ge=1, le=10)
    status: VaccineStatusEnum = VaccineStatusEnum.PENDING
    scheduled_text: Optional[str] = None
    scheduled_date: Optional[date] = None
    actual_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=250)
    side_effects: Optional[str] = None

class ChildVaccineStatusCreate(ChildVaccineStatusBase):
    pass

class ChildVaccineStatusUpdate(BaseModel):
    status: Optional[VaccineStatusEnum] = None
    scheduled_date: Optional[date] = None
    actual_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=250)
    side_effects: Optional[str] = None

class ChildVaccineStatus(ChildVaccineStatusBase):
    id: int

    class Config:
        from_attributes = True

class ChildVaccineStatusWithSchedule(ChildVaccineStatus):
    schedule: VaccinationSchedule

    class Config:
        from_attributes = True

class ChildVaccineStatusBrief(BaseModel):
    remaining_doses: int
    status: VaccineStatusEnum
    schedule: VaccinationSchedule

    class Config:
        from_attributes = True

# Backward-compatible alias if needed in future
ChildVaccineStatusPublic = ChildVaccineStatusBrief

# Request to record a given vaccine dose for a child
class RecordVaccineGivenRequest(BaseModel):
    schedule_id: int
    given_date: date
    side_effects: Optional[str] = None  # comma-separated text
    notes: Optional[str] = Field(None, max_length=250)

# Child milestones
class ChildMilestoneBase(BaseModel):
    category: VaccinationAgeGroupEnum
    milestone_code: str
    milestone_name: str
    sub_feature_1: Optional[str] = None
    sub_feature_2: Optional[str] = None
    sub_feature_3: Optional[str] = None

class ChildMilestoneCreate(ChildMilestoneBase):
    pass

class ChildMilestone(ChildMilestoneBase):
    id: int

    class Config:
        from_attributes = True

# Milestone status per child
class AchievedDifficultyEnum(str, Enum):
    EASY = 'Easy'
    NORMAL = 'Normal'
    CHALLENGING = 'Challenging'
    DIFFICULT = 'Difficult'

class ChildMilestoneStatusBase(BaseModel):
    child_id: int
    milestone_id: int
    achieved_date: Optional[date] = None
    difficulty: Optional[AchievedDifficultyEnum] = None
    special_milestone: bool = False

class ChildMilestoneStatusCreate(ChildMilestoneStatusBase):
    pass

class ChildMilestoneStatusUpdate(BaseModel):
    achieved_date: Optional[date] = None
    difficulty: Optional[AchievedDifficultyEnum] = None
    special_milestone: Optional[bool] = None

class ChildMilestoneStatus(ChildMilestoneStatusBase):
    id: int

    class Config:
        from_attributes = True

class ChildMilestoneStatusWithMilestone(ChildMilestoneStatus):
    milestone: ChildMilestone

    class Config:
        from_attributes = True

# Combined response: milestone definition + the child's status
class ChildMilestoneWithStatus(BaseModel):
    milestone: ChildMilestone
    status: ChildMilestoneStatus

    class Config:
        from_attributes = True

# Simplified response: milestone + flags
class ChildMilestoneWithFlags(BaseModel):
    milestone: ChildMilestone
    is_archived: bool
    special_milestone: bool

    class Config:
        from_attributes = True

# Request body to add a milestone status for a child (child_id comes from URL)
class AddChildMilestoneToChildRequest(BaseModel):
    milestone_id: int
    achieved_date: Optional[date] = None
    difficulty: Optional[AchievedDifficultyEnum] = None
    special_milestone: bool = False

# -------------------- Illness Logs --------------------
class IllnessSeverityEnum(str, Enum):
    MILD = 'Mild'
    MODERATE = 'Moderate'
    SEVERE = 'Severe'
    CRITICAL = 'Critical'

class ResolvedByEnum(str, Enum):
    PARENT = 'Parent'
    DOCTOR = 'Doctor'

class ChildIllnessLogBase(BaseModel):
    fever: bool = False
    cold: bool = False
    cough: bool = False
    sore_throat: bool = False
    headache: bool = False
    stomach_ache: bool = False
    nausea: bool = False
    vomiting: bool = False
    diarrhea: bool = False
    rash: bool = False
    fatigue: bool = False
    loss_of_appetite: bool = False
    temperature_c: Optional[float] = None
    temperature_time: Optional[datetime] = None
    symptom_start_date: Optional[datetime] = None
    severity: Optional[IllnessSeverityEnum] = None
    is_current: bool = True
    resolved_on: Optional[datetime] = None
    notes: Optional[str] = None

class ChildIllnessLogCreate(ChildIllnessLogBase):
    resolved_by: Optional[ResolvedByEnum] = None

class ChildIllnessLogUpdate(BaseModel):
    fever: Optional[bool] = None
    cold: Optional[bool] = None
    cough: Optional[bool] = None
    sore_throat: Optional[bool] = None
    headache: Optional[bool] = None
    stomach_ache: Optional[bool] = None
    nausea: Optional[bool] = None
    vomiting: Optional[bool] = None
    diarrhea: Optional[bool] = None
    rash: Optional[bool] = None
    fatigue: Optional[bool] = None
    loss_of_appetite: Optional[bool] = None
    temperature_c: Optional[float] = None
    temperature_time: Optional[datetime] = None
    symptom_start_date: Optional[datetime] = None
    severity: Optional[IllnessSeverityEnum] = None
    is_current: Optional[bool] = None
    resolved_on: Optional[datetime] = None
    resolved_by: Optional[ResolvedByEnum] = None
    notes: Optional[str] = None

class ResolveIllnessLogRequest(BaseModel):
    resolved_on: Optional[datetime] = None
    resolved_by: Optional[ResolvedByEnum] = None

class ChildIllnessLog(ChildIllnessLogBase):
    id: int
    child_id: int
    created_at: datetime
    updated_at: datetime
    resolved_by: Optional[ResolvedByEnum] = None

    class Config:
        from_attributes = True

class FoodAgeGroupEnum(str, Enum):
    INFANT = 'infant'
    TODDLER = 'toddler'
    PRESCHOOL = 'preschool'
    SCHOOLAGE = 'schoolage'
    ALL = 'all'

class FoodBase(BaseModel):
    food_name: str = Field(..., max_length=100)
    category_age_group: FoodAgeGroupEnum
    food_group: Optional[str] = Field(None, max_length=30)
    avg_serving_g: Optional[float] = None
    energy_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carb_g: Optional[float] = None
    fat_g: Optional[float] = None
    iron_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    vitamin_a_mcg: Optional[float] = None
    vitamin_c_mg: Optional[float] = None
    is_veg: bool = True

class Food(FoodBase):
    food_id: int

    class Config:
        from_attributes = True

class FoodBrief(BaseModel):
    food_id: int
    food_name: str
    category_age_group: FoodAgeGroupEnum
    food_group: Optional[str] = None
    is_veg: bool

    class Config:
        from_attributes = True

class WeeklyNutritionTopFood(BaseModel):
    food_id: int
    food_name: str
    food_group: Optional[str] = None

class WeeklyNutritionRecipe(BaseModel):
    id: int
    recipe_code: str
    recipe_name: str
    veg_nonveg: Optional[str] = None
    primary_nutrient: Optional[str] = None
    secondary_nutrients: List[str] = Field(default_factory=list)
    energy_density: Optional[str] = None
    meal_type: Optional[str] = None
    texture: Optional[str] = None
    ingredients: Optional[str] = None
    instructions: Optional[str] = None
    prep_time_mins: Optional[int] = None
    youtube_url: Optional[str] = None

class WeeklyNutritionSummaryResponse(BaseModel):
    child_id: int
    has_data: bool
    age_months: Optional[int] = None

    percent_of_requirement: Dict[str, float] = Field(default_factory=dict)
    adequacy: Dict[str, str] = Field(default_factory=dict)
    needed_nutrients: List[str] = Field(default_factory=list)

    top_foods_by_nutrient: Dict[str, List[WeeklyNutritionTopFood]] = Field(default_factory=dict)
    recommended_recipes: List[WeeklyNutritionRecipe] = Field(default_factory=list)

    message: Optional[str] = None
class MealTypeEnum(str, Enum):
    BREAKFAST = 'breakfast'
    MID_MORNING = 'mid_morning'
    LUNCH = 'lunch'
    EVENING_SNACK = 'evening_snack'
    DINNER = 'dinner'
    OTHER = 'other'

class ChildMealItemBase(BaseModel):
    meal_type: MealTypeEnum
    food_id: Optional[int] = None
    custom_food_name: Optional[str] = Field(None, max_length=100)
    serving_size_g: float = Field(..., gt=0)
    meal_frequency: int = Field(1, ge=1)
    is_ai_estimated: bool = False
    energy_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carb_g: Optional[float] = None
    fat_g: Optional[float] = None
    iron_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    vitamin_a_mcg: Optional[float] = None
    vitamin_c_mg: Optional[float] = None

class ChildMealItemCreate(ChildMealItemBase):
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        m = super().model_validate(obj, *args, **kwargs)
        if (m.food_id is None and not m.custom_food_name) or (m.food_id is not None and m.custom_food_name):
            raise ValueError("Provide either food_id or custom_food_name")
        return m

class ChildMealItem(ChildMealItemBase):
    id: int
    meal_log_id: int

    class Config:
        from_attributes = True

class ChildMealLogBase(BaseModel):
    log_date: date
    notes: Optional[str] = None

class ChildMealLogCreate(BaseModel):
    notes: Optional[str] = None
    items: List[ChildMealItemCreate]

class ChildMealLog(ChildMealLogBase):
    child_id: int
    id: int
    created_at: datetime
    items: List[ChildMealItem] = Field(default_factory=list)

    class Config:
        from_attributes = True


class LatestMealItem(BaseModel):
    meal_type: MealTypeEnum
    food_name: Optional[str] = None
    serving_size_g: float
    meal_frequency: int


class LatestMealLogResponse(BaseModel):
    log_date: date
    days_until_next_allowed: int
    items: List[LatestMealItem] = Field(default_factory=list)

# -------------------- Anthropometry --------------------
class ChildAnthropometryBase(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    muac_cm: Optional[float] = None
    avg_sleep_hours_per_day: Optional[float] = None

class ChildAnthropometryCreate(ChildAnthropometryBase):
    pass

class ChildAnthropometry(ChildAnthropometryBase):
    id: int
    child_id: int
    log_date: date
    created_at: datetime

    class Config:
        from_attributes = True

class ChildMedicalReportBase(BaseModel):
    report_type: ReportTypeEnum
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    mime_type: str = Field(..., max_length=100)

class ChildMedicalReport(ChildMedicalReportBase):
    report_id: int
    child_id: int
    file_size: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True