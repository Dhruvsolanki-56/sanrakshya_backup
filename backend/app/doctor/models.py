from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Date, Time, DateTime, Float, func, Enum, Boolean, ForeignKey, UniqueConstraint
from enum import Enum as PyEnum

from app.db.base import Base
from app.doctor.schemas import SpecializationEnum


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone_number = Column(String(15), unique=True, index=True, nullable=False)
    specialization = Column(Enum(SpecializationEnum, name="specialization_enum"), nullable=True)
    registration_number = Column(String(100), nullable=False)
    registration_council = Column(String(150), nullable=False)
    experience_years = Column(Integer, nullable=False)
    qualifications = Column(String(255), nullable=False)
    is_verified = Column(Boolean, nullable=False, server_default="0")
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)


class DoctorStatusEnum(str, PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class DoctorStatusSetByEnum(str, PyEnum):
    ADMIN = "admin"


class DoctorAuth(Base):
    __tablename__ = "doctor_auth"

    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), primary_key=True, index=True)
    password_hash = Column(Text, nullable=False)
    last_login = Column(TIMESTAMP, nullable=True)


class DoctorStatus(Base):
    __tablename__ = "doctor_status"

    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), primary_key=True, index=True)
    status = Column(Enum(DoctorStatusEnum, name="doctor_status_enum"), nullable=False, server_default="inactive")
    reason = Column(String(255), nullable=True)
    set_by = Column(Enum(DoctorStatusSetByEnum, name="doctor_status_set_by_enum"), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)


class PlaceTypeEnum(str, PyEnum):
    CLINIC = "clinic"
    HOSPITAL = "hospital"
    TELE = "tele"


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    line1 = Column(String(255), nullable=False)
    line2 = Column(String(255), nullable=True)
    area_locality = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    country = Column(String(100), nullable=True, server_default="India")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("line1", "city", "pincode", name="uq_address_basic"),
    )


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(Enum(PlaceTypeEnum, name="place_type_enum"), nullable=False)
    is_verified = Column(Boolean, nullable=False, server_default="0")
    created_by_doctor = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    address_id = Column(Integer, ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    official_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DoctorPlaceRoleEnum(str, PyEnum):
    OWNER = "owner"
    CONSULTING = "consulting"
    ASSISTANT = "assistant"


class DoctorPlaceRoleStatusEnum(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REMOVED = "removed"

class AdminOwnerEnum(str, PyEnum):
    ADMIN = "admin"
    OWNER = "owner"


class VerificationDocumentTypeEnum(str, PyEnum):
    MEDICAL_REGISTRATION = "medical_registration"
    DEGREE_CERTIFICATE = "degree_certificate"
    GOVERNMENT_ID = "government_id"
    OTHER = "other"


class RoleDocumentTypeEnum(str, PyEnum):
    CLINIC_LICENSE = "clinic_license"
    SHOP_ACT = "shop_act"
    HOSPITAL_AUTHORIZATION = "hospital_authorization"
    RENT_AGREEMENT = "rent_agreement"
    UTILITY_BILL = "utility_bill"
    OWNER_DECLARATION = "owner_declaration"
    OTHER = "other"


class ReviewStatusEnum(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DoctorPlaceRole(Base):
    __tablename__ = "doctor_place_roles"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(DoctorPlaceRoleEnum, name="doctor_place_role_enum"), nullable=False)
    status = Column(Enum(DoctorPlaceRoleStatusEnum, name="doctor_place_role_status_enum"), nullable=False, server_default="pending")
    changed_by = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    changed_at = Column(DateTime, nullable=True)
    approved_by_type = Column(
        Enum(
            AdminOwnerEnum,
            name="admin_owner_enum",
        ),
        nullable=True,
    )
    joined_at = Column(DateTime, nullable=True)
    suspended_reason = Column(String(255), nullable=True)


class DoctorVerificationDocument(Base):
    __tablename__ = "doctor_verification_documents"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    document_type = Column(
        Enum(
            VerificationDocumentTypeEnum,
            name="doctor_verification_document_type_enum",
        ),
        nullable=False,
    )
    document_name = Column(String(200), nullable=False)
    document_url = Column(Text, nullable=False)
    status = Column(
        Enum(
            ReviewStatusEnum,
            name="doctor_verification_document_status_enum",
        ),
        nullable=False,
        server_default="pending",
    )
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DoctorPlaceRoleDocument(Base):
    __tablename__ = "doctor_place_role_documents"

    id = Column(Integer, primary_key=True, index=True)
    doctor_place_role_id = Column(Integer, ForeignKey("doctor_place_roles.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(
        Enum(
            RoleDocumentTypeEnum,
            name="doctor_place_role_document_type_enum",
        ),
        nullable=False,
    )
    document_name = Column(String(200), nullable=False)
    document_url = Column(Text, nullable=False)
    status = Column(
        Enum(
            ReviewStatusEnum,
            name="doctor_place_role_document_status_enum",
        ),
        nullable=False,
        server_default="pending",
    )
    reviewed_by_type = Column(
        Enum(
            AdminOwnerEnum,
            name="doctor_place_role_document_reviewed_by_type_enum",
        ),
        nullable=True,
    )
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DayOfWeekEnum(str, PyEnum):
    MON = "mon"
    TUE = "tue"
    WED = "wed"
    THU = "thu"
    FRI = "fri"
    SAT = "sat"
    SUN = "sun"


class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Enum(DayOfWeekEnum, name="doctor_availability_day_enum"), nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="1")


class StaffRoleEnum(str, PyEnum):
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    HELPER = "helper"


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(150), nullable=True)
    role = Column(Enum(StaffRoleEnum, name="staff_role_enum"), nullable=False)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_by_doctor = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class StaffAuth(Base):
    __tablename__ = "staff_auth"

    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), primary_key=True, index=True)
    password_hash = Column(Text, nullable=True)


class StaffAvailability(Base):
    __tablename__ = "staff_availability"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Enum(DayOfWeekEnum, name="staff_availability_day_enum"), nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="1")


class AppointmentBookedByEnum(str, PyEnum):
    PARENT = "parent"
    DOCTOR = "doctor"
    ASSISTANT = "assistant"


class AppointmentReasonEnum(str, PyEnum):
    ROUTINE_CHECKUP = "routine_checkup"
    VACCINATION = "vaccination"
    FOLLOW_UP = "follow_up"
    GROWTH_MONITORING = "growth_monitoring"
    NUTRITION_CONSULT = "nutrition_consult"
    ILLNESS_CONSULT = "illness_consult"
    EMERGENCY = "emergency"
    OTHER = "other"


class AppointmentStatusEnum(str, PyEnum):
    BOOKED = "booked"
    CHECKED_IN = "checked_in"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    COMPLETED = "completed"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    booked_by = Column(Enum(AppointmentBookedByEnum, name="appointment_booked_by_enum"), nullable=False)
    booked_by_id = Column(Integer, nullable=False)
    reason = Column(Enum(AppointmentReasonEnum, name="appointment_reason_enum"), nullable=True)
    appointment_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatusEnum, name="appointment_status_enum"), nullable=False, server_default="booked")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class QueueStatusEnum(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class QueueClosedByEnum(str, PyEnum):
    DOCTOR = "doctor"
    ADMIN = "admin"
    SYSTEM = "system"


class Queue(Base):
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    queue_date = Column(Date, nullable=False)
    status = Column(Enum(QueueStatusEnum, name="queue_status_enum"), nullable=False, server_default="active")
    closed_reason = Column(String(255), nullable=True)
    closed_by = Column(Enum(QueueClosedByEnum, name="queue_closed_by_enum"), nullable=True)
    closed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("place_id", "queue_date", name="uq_place_date"),
    )


class QueueEntryTypeEnum(str, PyEnum):
    APPOINTMENT = "appointment"
    WALKIN = "walkin"
    TELE = "tele"
    EMERGENCY = "emergency"


class QueueItemStateEnum(str, PyEnum):
    BOOKED = "booked"
    ARRIVED = "arrived"
    VITALS_DONE = "vitals_done"
    PREPARED = "prepared"
    READY_FOR_DOCTOR = "ready_for_doctor"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class QueueItemPriorityEnum(str, PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"


class QueueItem(Base):
    __tablename__ = "queue_items"

    id = Column(Integer, primary_key=True, index=True)
    queue_id = Column(Integer, ForeignKey("queues.id", ondelete="CASCADE"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    entry_type = Column(Enum(QueueEntryTypeEnum, name="queue_entry_type_enum"), nullable=False)
    state = Column(Enum(QueueItemStateEnum, name="queue_item_state_enum"), nullable=False)
    priority = Column(Enum(QueueItemPriorityEnum, name="queue_item_priority_enum"), nullable=False, server_default="low")
    appointment_time = Column(DateTime, nullable=True)
    checked_in_at = Column(DateTime, nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class AssignmentActorTypeEnum(str, PyEnum):
    DOCTOR = "doctor"
    STAFF = "staff"


class QueueAssignment(Base):
    __tablename__ = "queue_assignments"

    id = Column(Integer, primary_key=True, index=True)
    queue_item_id = Column(Integer, ForeignKey("queue_items.id", ondelete="CASCADE"), nullable=False)
    assigned_to_type = Column(Enum(AssignmentActorTypeEnum, name="queue_assignment_actor_type_enum"), nullable=False)
    assigned_to_id = Column(Integer, nullable=False)
    assigned_at = Column(DateTime, server_default=func.now(), nullable=False)
    released_at = Column(DateTime, nullable=True)


class QueueAccessAssignment(Base):
    __tablename__ = "queue_access_assignments"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    queue_id = Column(Integer, ForeignKey("queues.id", ondelete="CASCADE"), nullable=False)
    actor_type = Column(Enum(AssignmentActorTypeEnum, name="queue_access_actor_type_enum"), nullable=False)
    actor_id = Column(Integer, nullable=False)
    access_date = Column(Date, nullable=False)
    can_view = Column(Boolean, nullable=False, server_default="1")
    can_work = Column(Boolean, nullable=False, server_default="1")
    assigned_by = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class VisitTypeEnum(str, PyEnum):
    WALKIN = "walkin"
    APPOINTMENT = "appointment"
    TELE = "tele"
    EMERGENCY = "emergency"


class VisitStatusEnum(str, PyEnum):
    CREATED = "created"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    queue_item_id = Column(Integer, ForeignKey("queue_items.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    visit_type = Column(Enum(VisitTypeEnum, name="visit_type_enum"), nullable=False)
    status = Column(Enum(VisitStatusEnum, name="visit_status_enum"), nullable=False, server_default="created")
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class VisitDoctorRoleEnum(str, PyEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    REVIEW = "review"


class VisitDoctor(Base):
    __tablename__ = "visit_doctors"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(VisitDoctorRoleEnum, name="visit_doctor_role_enum"), nullable=False, server_default="primary")
    assigned_at = Column(DateTime, server_default=func.now(), nullable=False)
    released_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("visit_id", "doctor_id", name="uq_visit_doctor"),
    )


class VisitVitalsEnteredByEnum(str, PyEnum):
    DOCTOR = "doctor"
    STAFF = "staff"
    DEVICE = "device"


class VisitVitals(Base):
    __tablename__ = "visit_vitals"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    head_circumference_cm = Column(Float, nullable=True)
    muac_cm = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    entered_by_type = Column(Enum(VisitVitalsEnteredByEnum, name="visit_vitals_entered_by_enum"), nullable=False)
    entered_by_id = Column(Integer, nullable=True)
    measured_at = Column(DateTime, server_default=func.now(), nullable=False)


class SymptomSeverityEnum(str, PyEnum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class SymptomRecordedByTypeEnum(str, PyEnum):
    PARENT = "parent"
    DOCTOR = "doctor"


class VisitSymptom(Base):
    __tablename__ = "visit_symptoms"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    symptom_name = Column(String(150), nullable=False)
    duration_days = Column(Integer, nullable=True)
    severity = Column(Enum(SymptomSeverityEnum, name="symptom_severity_enum"), nullable=True)
    recorded_by_type = Column(Enum(SymptomRecordedByTypeEnum, name="symptom_recorded_by_type_enum"), nullable=False)
    recorded_by_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DiagnosisTypeEnum(str, PyEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"


class VisitDiagnosis(Base):
    __tablename__ = "visit_diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    diagnosis_text = Column(String(255), nullable=False)
    diagnosis_code = Column(String(50), nullable=True)
    diagnosis_type = Column(Enum(DiagnosisTypeEnum, name="diagnosis_type_enum"), nullable=False, server_default="primary")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class PrescriptionItemTypeEnum(str, PyEnum):
    MEDICINE = "medicine"
    INJECTION = "injection"
    VACCINE = "vaccine"
    PROCEDURE = "procedure"
    OTHER = "other"


class VisitPrescriptionItem(Base):
    __tablename__ = "visit_prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    item_type = Column(Enum(PrescriptionItemTypeEnum, name="prescription_item_type_enum"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DrugSourceEnum(str, PyEnum):
    CSV = "csv"
    CUSTOM = "custom"


class DosageFormEnum(str, PyEnum):
    TABLET = "tablet"
    CAPSULE = "capsule"
    SYRUP = "syrup"
    SUSPENSION = "suspension"
    DROP = "drop"
    INHALER = "inhaler"
    OINTMENT = "ointment"
    OTHER = "other"


class MedicineRouteEnum(str, PyEnum):
    ORAL = "oral"
    INHALATION = "inhalation"
    TOPICAL = "topical"
    OTHER = "other"


class MealRelationEnum(str, PyEnum):
    BEFORE_MEAL = "before_meal"
    AFTER_MEAL = "after_meal"
    WITH_MEAL = "with_meal"
    ANYTIME = "anytime"


class VisitMedicine(Base):
    __tablename__ = "visit_medicines"

    id = Column(Integer, primary_key=True, index=True)
    prescription_item_id = Column(Integer, ForeignKey("visit_prescription_items.id", ondelete="CASCADE"), nullable=False)
    drug_source = Column(Enum(DrugSourceEnum, name="medicine_drug_source_enum"), nullable=False)
    medicine_id = Column(String(36), nullable=True)
    custom_drug_id = Column(Integer, ForeignKey("custom_doctor_drugs.id"), nullable=True)
    dosage_form = Column(Enum(DosageFormEnum, name="medicine_dosage_form_enum"), nullable=False)
    route = Column(Enum(MedicineRouteEnum, name="medicine_route_enum"), nullable=False)
    duration_days = Column(Integer, nullable=False)
    meal_relation = Column(Enum(MealRelationEnum, name="medicine_meal_relation_enum"), nullable=False, server_default="after_meal")
    is_prn = Column(Boolean, nullable=False, server_default="0")
    instructions = Column(Text, nullable=True)


class VisitMedicineTiming(Base):
    __tablename__ = "visit_medicine_timing"

    medicine_id = Column(Integer, ForeignKey("visit_medicines.id", ondelete="CASCADE"), primary_key=True, index=True)
    morning = Column(Boolean, nullable=False, server_default="0")
    afternoon = Column(Boolean, nullable=False, server_default="0")
    evening = Column(Boolean, nullable=False, server_default="0")
    night = Column(Boolean, nullable=False, server_default="0")
    dose_quantity = Column(Float, nullable=False)


class CustomDrugDosageFormEnum(str, PyEnum):
    TABLET = "tablet"
    CAPSULE = "capsule"
    SYRUP = "syrup"
    SUSPENSION = "suspension"
    INJECTABLE = "injectable"
    DROP = "drop"
    OTHER = "other"


class CustomDoctorDrug(Base):
    __tablename__ = "custom_doctor_drugs"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    brand_name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=False)
    dosage_form = Column(Enum(CustomDrugDosageFormEnum, name="custom_drug_dosage_form_enum"), nullable=False)
    manufacturer = Column(String(200), nullable=True)
    is_combo = Column(Boolean, nullable=False, server_default="0")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class StrengthUnitEnum(str, PyEnum):
    MG = "mg"
    MCG = "mcg"
    G = "g"
    ML = "ml"
    IU = "iu"
    PERCENT = "percent"


class CustomDoctorDrugSalt(Base):
    __tablename__ = "custom_doctor_drug_salts"

    id = Column(Integer, primary_key=True, index=True)
    custom_drug_id = Column(Integer, ForeignKey("custom_doctor_drugs.id", ondelete="CASCADE"), nullable=False)
    salt_name = Column(String(150), nullable=False)
    strength_value = Column(Float, nullable=False)
    strength_unit = Column(Enum(StrengthUnitEnum, name="custom_drug_strength_unit_enum"), nullable=False)


class InjectionRouteEnum(str, PyEnum):
    IV = "iv"
    IM = "im"
    SC = "sc"
    INTRADERMAL = "intradermal"
    OTHER = "other"


class DoseUnitEnum(str, PyEnum):
    MG = "mg"
    ML = "ml"
    IU = "iu"


class AdministeredByEnum(str, PyEnum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    STAFF = "staff"


class VisitInjection(Base):
    __tablename__ = "visit_injections"

    id = Column(Integer, primary_key=True, index=True)
    prescription_item_id = Column(Integer, ForeignKey("visit_prescription_items.id", ondelete="CASCADE"), nullable=False)
    drug_source = Column(Enum(DrugSourceEnum, name="injection_drug_source_enum"), nullable=False)
    medicine_id = Column(String(36), nullable=True)
    custom_drug_id = Column(Integer, ForeignKey("custom_doctor_drugs.id"), nullable=True)
    route = Column(Enum(InjectionRouteEnum, name="injection_route_enum"), nullable=False)
    site = Column(String(100), nullable=True)
    dose_value = Column(Float, nullable=True)
    dose_unit = Column(Enum(DoseUnitEnum, name="injection_dose_unit_enum"), nullable=True)
    administered_by = Column(Enum(AdministeredByEnum, name="injection_administered_by_enum"), nullable=True)
    administered_at = Column(DateTime, nullable=True)
    instructions = Column(Text, nullable=True)


class VaccineRouteEnum(str, PyEnum):
    IM = "im"
    SC = "sc"
    ORAL = "oral"
    INTRADERMAL = "intradermal"


class VisitVaccine(Base):
    __tablename__ = "visit_vaccines"

    id = Column(Integer, primary_key=True, index=True)
    prescription_item_id = Column(Integer, ForeignKey("visit_prescription_items.id", ondelete="CASCADE"), nullable=False)
    vaccine_name = Column(String(200), nullable=False)
    brand_name = Column(String(200), nullable=True)
    dose_number = Column(Integer, nullable=True)
    route = Column(Enum(VaccineRouteEnum, name="vaccine_route_enum"), nullable=True)
    site = Column(String(100), nullable=True)
    next_due_date = Column(Date, nullable=True)
    administered_at = Column(DateTime, server_default=func.now(), nullable=False)


class ProcedureTypeEnum(str, PyEnum):
    NEBULIZATION = "nebulization"
    THERAPY = "therapy"
    MINOR_PROCEDURE = "minor_procedure"
    OTHER = "other"


class VisitProcedure(Base):
    __tablename__ = "visit_procedures"

    id = Column(Integer, primary_key=True, index=True)
    prescription_item_id = Column(Integer, ForeignKey("visit_prescription_items.id", ondelete="CASCADE"), nullable=False)
    procedure_name = Column(String(200), nullable=False)
    procedure_type = Column(Enum(ProcedureTypeEnum, name="procedure_type_enum"), nullable=False)
    frequency_per_day = Column(Integer, nullable=True)
    duration_days = Column(Integer, nullable=True)
    instructions = Column(Text, nullable=True)


class ReferralUrgencyEnum(str, PyEnum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class VisitReferral(Base):
    __tablename__ = "visit_referrals"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    referred_to_name = Column(String(200), nullable=True)
    referred_to_specialization = Column(String(150), nullable=True)
    referred_to_place = Column(String(200), nullable=True)
    reason = Column(Text, nullable=True)
    urgency = Column(Enum(ReferralUrgencyEnum, name="referral_urgency_enum"), nullable=False, server_default="routine")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class DocumentTypeEnum(str, PyEnum):
    PRESCRIPTION = "prescription"
    REPORT = "report"
    IMAGE = "image"
    EXTERNAL_DOCUMENT = "external_document"
    OTHER = "other"


class DocumentUploadedByEnum(str, PyEnum):
    DOCTOR = "doctor"
    STAFF = "staff"
    PARENT = "parent"


class VisitDocument(Base):
    __tablename__ = "visit_documents"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=True)
    child_id = Column(Integer, ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    document_type = Column(Enum(DocumentTypeEnum, name="visit_document_type_enum"), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_url = Column(Text, nullable=True)
    mime_type = Column(String(50), nullable=True)
    uploaded_by_type = Column(Enum(DocumentUploadedByEnum, name="visit_document_uploaded_by_enum"), nullable=False)
    uploaded_by_id = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)


class AdviceCategoryEnum(str, PyEnum):
    GENERAL = "general"
    NUTRITION = "nutrition"
    MEDICATION = "medication"
    LIFESTYLE = "lifestyle"
    WARNING_SIGNS = "warning_signs"
    OTHER = "other"


class VisitAdvice(Base):
    __tablename__ = "visit_advice"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    advice_text = Column(Text, nullable=False)
    advice_category = Column(Enum(AdviceCategoryEnum, name="visit_advice_category_enum"), nullable=False, server_default="general")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class FollowUpTypeEnum(str, PyEnum):
    ROUTINE = "routine"
    REVIEW = "review"
    URGENT = "urgent"
    TELE = "tele"


class VisitFollowUp(Base):
    __tablename__ = "visit_followups"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    follow_up_required = Column(Boolean, nullable=False, server_default="0")
    follow_up_type = Column(Enum(FollowUpTypeEnum, name="visit_followup_type_enum"), nullable=True)
    follow_up_date = Column(Date, nullable=True)
    follow_up_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("visit_id", name="uq_visit_followup_visit"),
    )


class VisitClinicalSummary(Base):
    __tablename__ = "visit_clinical_summary"

    visit_id = Column(Integer, ForeignKey("visits.id", ondelete="CASCADE"), primary_key=True, index=True)
    has_vitals = Column(Boolean, nullable=False, server_default="0")
    has_symptoms = Column(Boolean, nullable=False, server_default="0")
    has_diagnosis = Column(Boolean, nullable=False, server_default="0")
    has_prescription = Column(Boolean, nullable=False, server_default="0")
    has_advice = Column(Boolean, nullable=False, server_default="0")
    has_followup = Column(Boolean, nullable=False, server_default="0")
    has_referral = Column(Boolean, nullable=False, server_default="0")
    has_documents = Column(Boolean, nullable=False, server_default="0")
