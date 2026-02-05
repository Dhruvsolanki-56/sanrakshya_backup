from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.doctor.schemas import DoctorCreate
from app.doctor.cruds import doctor as doctor_crud
from app.doctor.services import place_service
from app.doctor.models import Place as PlaceModel, DoctorPlaceRole, DoctorPlaceRoleDocument


def register_doctor(db: Session, doctor: DoctorCreate):
    if doctor_crud.get_doctor_by_email(db, email=doctor.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    if doctor_crud.get_doctor_by_phone(db, phone_number=doctor.phone_number):
        raise HTTPException(status_code=400, detail="Phone number already registered")

    try:
        return doctor_crud.create_doctor(db=db, doctor=doctor)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or phone already registered")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


def get_doctor_home(db: Session, *, current_doctor):
    workplace_roles = []

    if getattr(current_doctor, "is_verified", False):
        # All roles (any status) for this doctor with their places
        rows = (
            db.query(PlaceModel, DoctorPlaceRole)
            .join(DoctorPlaceRole, DoctorPlaceRole.place_id == PlaceModel.id)
            .filter(DoctorPlaceRole.doctor_id == current_doctor.doctor_id)
            .all()
        )

        for place, role in rows:
            docs_query = db.query(DoctorPlaceRoleDocument).filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
            attempts_count = docs_query.count()
            latest_doc = docs_query.order_by(DoctorPlaceRoleDocument.created_at.desc()).first()
            latest_doc_out = None
            if latest_doc is not None:
                latest_doc_out = {
                    "document_type": getattr(latest_doc.document_type, "value", latest_doc.document_type),
                    "document_name": latest_doc.document_name,
                    "status": getattr(latest_doc.status, "value", latest_doc.status),
                    "review_notes": latest_doc.review_notes,
                }
            workplace_roles.append(
                {
                    "role_id": role.id,
                    "place_id": place.id,
                    "place_name": place.name,
                    "place_type": str(place.type) if not isinstance(place.type, str) else place.type,
                    "place_is_verified": bool(place.is_verified),
                    "role": role.role,
                    "role_status": str(role.status) if not isinstance(role.status, str) else role.status,
                    "role_doc_attempts_count": int(attempts_count),
                    "role_latest_document": latest_doc_out,
                }
            )

    return {"doctor": current_doctor, "workplace_roles": workplace_roles}
