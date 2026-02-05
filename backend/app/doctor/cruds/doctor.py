from sqlalchemy.orm import Session, defer

from app.core.security import get_password_hash
from app.doctor.models import Doctor, DoctorAuth
from app.doctor.schemas import DoctorCreate


def get_doctor_by_email(db: Session, email: str):
    return (
        db.query(Doctor)
        .options(defer(Doctor.specialization))
        .filter(Doctor.email == email)
        .first()
    )


def get_doctor_by_phone(db: Session, phone_number: str):
    return (
        db.query(Doctor)
        .options(defer(Doctor.specialization))
        .filter(Doctor.phone_number == phone_number)
        .first()
    )


def create_doctor(db: Session, doctor: DoctorCreate):
    hashed_password = get_password_hash(doctor.password)
    db_doctor = Doctor(
        full_name=doctor.full_name,
        email=doctor.email,
        phone_number=doctor.phone_number,
        specialization=doctor.specialization,
        registration_number=doctor.registration_number,
        registration_council=doctor.registration_council,
        experience_years=doctor.experience_years,
        qualifications=doctor.qualifications,
        is_verified=False,
    )
    db.add(db_doctor)
    db.flush()

    db_auth = DoctorAuth(
        doctor_id=db_doctor.doctor_id,
        password_hash=hashed_password,
        last_login=None,
    )
    db.add(db_auth)
    db.commit()
    db.refresh(db_doctor)
    db.refresh(db_auth)
    return db_doctor


def get_doctor_and_auth_by_email(db: Session, email: str):
    doctor = get_doctor_by_email(db, email=email)
    if not doctor:
        return None
    auth = db.query(DoctorAuth).filter(DoctorAuth.doctor_id == doctor.doctor_id).first()
    if not auth:
        return None
    return doctor, auth
