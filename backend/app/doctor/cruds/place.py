from datetime import datetime
from sqlalchemy.orm import Session

from app.doctor.models import (
    Place,
    PlaceTypeEnum,
    DoctorPlaceRole,
    DoctorPlaceRoleEnum,
    DoctorPlaceRoleStatusEnum,
    AdminOwnerEnum,
    Address as AddressModel,
)
from app.doctor.schemas import PlaceCreate, AddressCreate
from app.core.time import now_ist


def create_place_for_doctor(db: Session, doctor_id: int, place: PlaceCreate, address_id: int | None = None):
    place_type = PlaceTypeEnum(place.type) if not isinstance(place.type, PlaceTypeEnum) else place.type
    db_place = Place(
        name=place.name,
        type=place_type,
        is_verified=False,
        created_by_doctor=doctor_id,
        address_id=address_id,
        official_phone=getattr(place, "official_phone", None),
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)

    now = now_ist()
    db_role = DoctorPlaceRole(
        doctor_id=doctor_id,
        place_id=db_place.id,
        role=DoctorPlaceRoleEnum.OWNER,
        status=DoctorPlaceRoleStatusEnum.APPROVED,
        changed_by=doctor_id,
        changed_at=now,
        approved_by_type=AdminOwnerEnum.OWNER,
        joined_at=now,
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)

    return db_place


def get_place_by_name_and_type(db: Session, name: str, place_type: PlaceTypeEnum):
    return (
        db.query(Place)
        .filter(
            Place.name == name,
            Place.type == place_type,
        )
        .first()
    )


def get_address_by_basic(db: Session, *, line1: str, city: str, pincode: str):
    return (
        db.query(AddressModel)
        .filter(
            AddressModel.line1 == line1,
            AddressModel.city == city,
            AddressModel.pincode == pincode,
        )
        .first()
    )


def create_address(db: Session, address_in: AddressCreate):
    db_obj = AddressModel(
        line1=address_in.line1,
        line2=address_in.line2,
        area_locality=address_in.area_locality,
        city=address_in.city,
        state=address_in.state,
        pincode=address_in.pincode,
        country=address_in.country,
    )
    db.add(db_obj)
    db.flush()
    return db_obj


def get_or_create_address(db: Session, address_in: AddressCreate):
    existing = get_address_by_basic(db, line1=address_in.line1, city=address_in.city, pincode=address_in.pincode)
    if existing:
        return existing
    return create_address(db, address_in)


def get_place_by_id(db: Session, place_id: int):
    return db.query(Place).filter(Place.id == place_id).first()


def get_owner_roles(db: Session, place_id: int):
    return (
        db.query(DoctorPlaceRole)
        .filter(
            DoctorPlaceRole.place_id == place_id,
            DoctorPlaceRole.role == DoctorPlaceRoleEnum.OWNER,
            DoctorPlaceRole.status == DoctorPlaceRoleStatusEnum.APPROVED,
        )
        .all()
    )


def get_workplaces_for_doctor(db: Session, doctor_id: int):
    return (
        db.query(Place)
        .join(DoctorPlaceRole, DoctorPlaceRole.place_id == Place.id)
        .filter(
            DoctorPlaceRole.doctor_id == doctor_id,
            DoctorPlaceRole.status == DoctorPlaceRoleStatusEnum.APPROVED,
        )
        .all()
    )


def get_role_for_doctor_place(db: Session, doctor_id: int, place_id: int):
    return (
        db.query(DoctorPlaceRole)
        .filter(
            DoctorPlaceRole.place_id == place_id,
            DoctorPlaceRole.doctor_id == doctor_id,
            DoctorPlaceRole.status != DoctorPlaceRoleStatusEnum.REMOVED,
        )
        .order_by(DoctorPlaceRole.id.desc())
        .first()
    )


def create_role_request(db: Session, doctor_id: int, place_id: int, role: DoctorPlaceRoleEnum):
    raw_value = getattr(role, "value", role)
    role_enum = DoctorPlaceRoleEnum(raw_value) if not isinstance(role, DoctorPlaceRoleEnum) else role
    db_role = DoctorPlaceRole(
        doctor_id=doctor_id,
        place_id=place_id,
        role=role_enum,
        status=DoctorPlaceRoleStatusEnum.PENDING,
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


def get_role_by_id(db: Session, role_id: int):
    return db.query(DoctorPlaceRole).filter(DoctorPlaceRole.id == role_id).first()


def set_role_approved(db: Session, role: DoctorPlaceRole, approver_doctor_id: int):
    now = now_ist()
    role.status = DoctorPlaceRoleStatusEnum.APPROVED
    role.changed_by = approver_doctor_id
    role.changed_at = now
    role.approved_by_type = AdminOwnerEnum.OWNER
    # set joined_at only once, if not already set
    if not getattr(role, "joined_at", None):
        role.joined_at = now
    db.add(role)
    db.commit()
    db.refresh(role)
    return role
