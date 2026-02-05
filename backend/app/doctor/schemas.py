from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.schemas import phone_number_regex


class SpecializationEnum(str, Enum):
    PEDIATRICS = "pediatrics"
    NEONATOLOGY = "neonatology"
    PEDIATRIC_NUTRITION = "pediatric_nutrition"
    PEDIATRIC_ENDOCRINOLOGY = "pediatric_endocrinology"
    PEDIATRIC_NEUROLOGY = "pediatric_neurology"
    PEDIATRIC_CARDIOLOGY = "pediatric_cardiology"
    PEDIATRIC_PULMONOLOGY = "pediatric_pulmonology"
    PEDIATRIC_GASTROENTEROLOGY = "pediatric_gastroenterology"
    PEDIATRIC_NEPHROLOGY = "pediatric_nephrology"
    PEDIATRIC_INFECTIOUS_DISEASES = "pediatric_infectious_diseases"
    PEDIATRIC_HEMATOLOGY_ONCOLOGY = "pediatric_hematology_oncology"
    DEVELOPMENTAL_PEDIATRICS = "developmental_pediatrics"
    PEDIATRIC_PSYCHIATRY = "pediatric_psychiatry"
    PEDIATRIC_ORTHOPEDICS = "pediatric_orthopedics"
    PEDIATRIC_OPHTHALMOLOGY = "pediatric_ophthalmology"
    PEDIATRIC_DENTISTRY = "pediatric_dentistry"
    PEDIATRIC_ENT = "pediatric_ent"
    SPEECH_AND_LANGUAGE_THERAPY = "speech_and_language_therapy"
    PHYSIOTHERAPY_OCCUPATIONAL_THERAPY = "physiotherapy_occupational_therapy"
    PUBLIC_HEALTH_COMMUNITY_PEDIATRICS = "public_health_community_pediatrics"


class DoctorBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone_number: str = Field(..., pattern=phone_number_regex)
    specialization: Optional[SpecializationEnum] = None
    registration_number: str = Field(..., max_length=100)
    registration_council: str = Field(..., max_length=150)
    experience_years: int = Field(..., ge=0, le=80)
    qualifications: str = Field(..., min_length=2, max_length=255)


class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=8, max_length=50)


class DoctorUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=phone_number_regex)
    specialization: Optional[SpecializationEnum] = None
    hospital_name: Optional[str] = Field(None, max_length=100)
    medical_licence_no: Optional[str] = Field(None, max_length=50)
    experience_years: Optional[int] = Field(None, ge=0, le=80)
    qualifications: Optional[str] = Field(None, min_length=2, max_length=255)


class DoctorInDBBase(DoctorBase):
    doctor_id: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DoctorPlaceRoleDocumentHomeOut(BaseModel):
    document_type: RoleDocumentTypeEnum
    document_name: str
    status: ReviewStatusEnum
    review_notes: Optional[str] = None


class PlaceWithAddress(BaseModel):
    id: int
    name: str
    type: str
    is_verified: bool
    address: Optional[Address] = None


class DoctorWorkplaceSummary(BaseModel):
    role_id: int
    place_id: int
    place_name: str
    place_type: str
    place_is_verified: bool
    role: DoctorPlaceRoleEnum
    role_status: str
    role_doc_attempts_count: int = 0
    role_latest_document: Optional[DoctorPlaceRoleDocumentHomeOut] = None


class DoctorHomeOut(BaseModel):
    doctor: "Doctor"
    workplace_roles: list[DoctorWorkplaceSummary]


class ReviewNoteIn(BaseModel):
    review_notes: Optional[str] = Field(None, max_length=255)


class OwnerDoctorOut(BaseModel):
    doctor_id: int
    full_name: str
    email: EmailStr
    phone_number: str
    specialization: Optional[SpecializationEnum] = None
    registration_number: str
    registration_council: str
    experience_years: int
    qualifications: str
    is_verified: bool
    created_at: datetime


class OwnerRoleDocumentOut(BaseModel):
    id: int
    doctor_place_role_id: int
    document_type: RoleDocumentTypeEnum
    document_name: str
    status: ReviewStatusEnum
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class OwnerDoctorVerificationDocumentOut(BaseModel):
    id: int
    doctor_id: int
    document_type: VerificationDocumentTypeEnum
    document_name: str
    status: ReviewStatusEnum
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class OwnerRoleRequestOut(BaseModel):
    role_id: int
    place_id: int
    doctor: OwnerDoctorOut
    requested_role: DoctorPlaceRoleEnum
    role_status: str
    role_rejection_reason: Optional[str] = None
    attempt_count: int = 0
    role_documents: list[OwnerRoleDocumentOut] = []
    doctor_verification_documents: list[OwnerDoctorVerificationDocumentOut] = []


class DoctorVerificationStatusOut(BaseModel):
    status: str
    doc_status: Optional[str] = None
    review_note: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None


class OwnerRoleActionOut(BaseModel):
    status: str
    role_id: int
    place_id: int


# Document enums for requests
class VerificationDocumentTypeEnum(str, Enum):
    MEDICAL_REGISTRATION = "medical_registration"
    DEGREE_CERTIFICATE = "degree_certificate"
    GOVERNMENT_ID = "government_id"
    OTHER = "other"


class RoleDocumentTypeEnum(str, Enum):
    CLINIC_LICENSE = "clinic_license"
    SHOP_ACT = "shop_act"
    HOSPITAL_AUTHORIZATION = "hospital_authorization"
    RENT_AGREEMENT = "rent_agreement"
    UTILITY_BILL = "utility_bill"
    OWNER_DECLARATION = "owner_declaration"
    OTHER = "other"


class ReviewStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DoctorVerificationDocumentOut(BaseModel):
    id: int
    doctor_id: int
    document_type: VerificationDocumentTypeEnum
    document_name: str
    document_url: str
    status: ReviewStatusEnum
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorPlaceRoleDocumentOut(BaseModel):
    id: int
    doctor_place_role_id: int
    document_type: RoleDocumentTypeEnum
    document_name: str
    document_url: str
    status: ReviewStatusEnum
    reviewed_by_type: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Doctor(DoctorInDBBase):
    pass


class AddressBase(BaseModel):
    line1: str = Field(..., min_length=1, max_length=255)
    line2: Optional[str] = Field(None, max_length=255)
    area_locality: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pincode: str = Field(..., min_length=3, max_length=10)
    country: Optional[str] = Field("India", max_length=100)


class AddressCreate(AddressBase):
    pass


class Address(AddressBase):
    pass


class PlaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: str = Field(...)
    official_phone: Optional[str] = Field(None, pattern=phone_number_regex)


class DoctorPlaceRoleEnum(str, Enum):
    OWNER = "owner"
    CONSULTING = "consulting"
    ASSISTANT = "assistant"


class PlaceCreate(PlaceBase):
    role: DoctorPlaceRoleEnum = DoctorPlaceRoleEnum.OWNER
    address: Optional[AddressCreate] = None


class PlaceInDBBase(PlaceBase):
    id: int
    is_verified: bool
    created_by_doctor: Optional[int]
    created_at: datetime
    address_id: Optional[int] = None

    class Config:
        from_attributes = True


class Place(PlaceInDBBase):
    pass


class PlaceSummary(BaseModel):
    id: int
    name: str
    type: str
    is_verified: bool

    class Config:
        from_attributes = True


class PlaceRoleRequest(BaseModel):
    role: DoctorPlaceRoleEnum


class DoctorPlaceRoleOut(BaseModel):
    id: int
    doctor_id: int
    place_id: int
    role: DoctorPlaceRoleEnum
    status: str
    changed_by: Optional[int] = None
    changed_at: Optional[datetime] = None
    approved_by_type: Optional[str] = None
    joined_at: Optional[datetime] = None
    suspended_reason: Optional[str] = None

    class Config:
        from_attributes = True
