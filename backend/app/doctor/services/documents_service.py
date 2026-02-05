from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.doctor.models import (
    DoctorVerificationDocument,
    VerificationDocumentTypeEnum as ModelVerificationType,
    DoctorPlaceRoleDocument,
    RoleDocumentTypeEnum as ModelRoleDocType,
    DoctorPlaceRole,
    DoctorPlaceRoleStatusEnum,
    DoctorStatus,
    DoctorStatusEnum,
    DoctorStatusSetByEnum,
    Doctor,
    ReviewStatusEnum,
)
from app.doctor.schemas import (
    VerificationDocumentTypeEnum,
    RoleDocumentTypeEnum,
)
from app.doctor.services import doc_storage
from app.doctor.cruds import place as place_crud


def upload_verification_document(
    db: Session,
    *,
    current_doctor,
    document_type: VerificationDocumentTypeEnum,
    document_name: str,
    file: UploadFile,
) -> DoctorVerificationDocument:
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")
    # Enforce max 3 attempts and allow re-upload only if latest document was rejected
    query = db.query(DoctorVerificationDocument).filter(
        DoctorVerificationDocument.doctor_id == current_doctor.doctor_id
    )
    attempts_count = query.count()
    latest = query.order_by(DoctorVerificationDocument.created_at.desc()).first()

    # If already tried 3 times, block further uploads
    if attempts_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts reached",
        )

    # If there is a previous doc and it is not rejected, block reattempt
    if latest and latest.status != ReviewStatusEnum.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification document already uploaded or under review",
        )
    model_doc = DoctorVerificationDocument(
        doctor_id=current_doctor.doctor_id,
        document_type=ModelVerificationType(document_type.value),
        document_name=document_name,
        document_url="",
    )
    db.add(model_doc)
    db.flush()
    rel_path = doc_storage.build_verification_path(current_doctor.doctor_id, model_doc.id, file.filename)
    doc_storage.save_upload_to_path(rel_path, file)
    model_doc.document_url = rel_path
    db.add(model_doc)

    # Ensure a DoctorStatus row exists for this doctor; set to INACTIVE on first upload
    status_row = (
        db.query(DoctorStatus)
        .filter(DoctorStatus.doctor_id == current_doctor.doctor_id)
        .first()
    )
    if not status_row:
        status_row = DoctorStatus(
            doctor_id=current_doctor.doctor_id,
            status=DoctorStatusEnum.INACTIVE,
            reason=None,
            set_by=DoctorStatusSetByEnum.ADMIN,
        )
        db.add(status_row)

    db.commit()
    db.refresh(model_doc)
    return model_doc


def list_verification_documents(db: Session, *, current_doctor):
    rows = (
        db.query(DoctorVerificationDocument)
        .filter(DoctorVerificationDocument.doctor_id == current_doctor.doctor_id)
        .order_by(DoctorVerificationDocument.created_at.desc())
        .all()
    )
    return rows


def _ensure_role_upload_access(db: Session, *, current_doctor, role: DoctorPlaceRole) -> None:
    if getattr(role, "status", None) == DoctorPlaceRoleStatusEnum.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role is rejected; document upload is not allowed",
        )
    if getattr(role, "status", None) == DoctorPlaceRoleStatusEnum.REMOVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role is removed; document upload is not allowed",
        )
    if role.doctor_id == current_doctor.doctor_id:
        return
    owners = place_crud.get_owner_roles(db, role.place_id)
    owner_ids = {o.doctor_id for o in owners}
    if current_doctor.doctor_id not in owner_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to upload for this role")


def upload_role_document(
    db: Session,
    *,
    current_doctor,
    role_id: int,
    document_type: RoleDocumentTypeEnum,
    document_name: str,
    file: UploadFile,
) -> DoctorPlaceRoleDocument:
    role = db.query(DoctorPlaceRole).filter(DoctorPlaceRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    _ensure_role_upload_access(db, current_doctor=current_doctor, role=role)
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")

    # Enforce max 3 attempts per role (overall) and allow re-upload only if latest submission was rejected
    model_doc_type = ModelRoleDocType(document_type.value)
    query = db.query(DoctorPlaceRoleDocument).filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
    attempts_count = query.count()
    latest = query.order_by(DoctorPlaceRoleDocument.created_at.desc()).first()

    if attempts_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum attempts reached for this role",
        )

    if latest and latest.status != ReviewStatusEnum.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Re-upload allowed only when latest document is rejected",
        )
    model_doc = DoctorPlaceRoleDocument(
        doctor_place_role_id=role.id,
        document_type=model_doc_type,
        document_name=document_name,
        document_url="",
    )
    db.add(model_doc)
    db.flush()
    rel_path = doc_storage.build_role_doc_path(role.place_id, role.id, model_doc.id, file.filename)
    doc_storage.save_upload_to_path(rel_path, file)
    model_doc.document_url = rel_path
    db.add(model_doc)
    db.commit()
    db.refresh(model_doc)
    return model_doc


def list_role_documents(db: Session, *, current_doctor, role_id: int):
    role = db.query(DoctorPlaceRole).filter(DoctorPlaceRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    _ensure_role_upload_access(db, current_doctor=current_doctor, role=role)
    rows = (
        db.query(DoctorPlaceRoleDocument)
        .filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
        .order_by(DoctorPlaceRoleDocument.created_at.desc())
        .all()
    )
    return rows


def get_role_documents_for_doctor_place(db: Session, *, current_doctor, place_id: int):
    """Return all role documents for the current doctor at a given place."""
    role = (
        db.query(DoctorPlaceRole)
        .filter(
            DoctorPlaceRole.place_id == place_id,
            DoctorPlaceRole.doctor_id == current_doctor.doctor_id,
            DoctorPlaceRole.status != DoctorPlaceRoleStatusEnum.REMOVED,
        )
        .order_by(DoctorPlaceRole.id.desc())
        .first()
    )
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found for this place")

    rows = (
        db.query(DoctorPlaceRoleDocument)
        .filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
        .order_by(DoctorPlaceRoleDocument.created_at.desc())
        .all()
    )
    return rows


def get_doctor_verification_status(db: Session, *, current_doctor):
    row = (
        db.query(DoctorStatus)
        .filter(DoctorStatus.doctor_id == current_doctor.doctor_id)
        .first()
    )

    # Find the most recently reviewed verification document (if any)
    latest_review = (
        db.query(DoctorVerificationDocument)
        .filter(DoctorVerificationDocument.doctor_id == current_doctor.doctor_id)
        .order_by(DoctorVerificationDocument.created_at.desc())
        .first()
    )
    if latest_review:
        reviewed_at = latest_review.reviewed_at if latest_review.reviewed_at else None
        doc_status = getattr(latest_review.status, "value", str(latest_review.status))
        doc_created_at = latest_review.created_at
        review_note = latest_review.review_notes
    else:
        reviewed_at = None
        doc_status = None
        doc_created_at = None
        review_note = None

    if row:
        return {
            "status": getattr(row.status, "value", str(row.status)),
            "doc_status": doc_status,
            "review_note": review_note,
            "created_at": doc_created_at,
            "reviewed_at": reviewed_at,
        }

    # Fallback to Doctor.is_verified if status row doesn't exist
    doc = db.query(Doctor).filter(Doctor.doctor_id == current_doctor.doctor_id).first()
    status_value = DoctorStatusEnum.ACTIVE.value if getattr(doc, "is_verified", False) else DoctorStatusEnum.INACTIVE.value
    return {
        "status": status_value,
        "doc_status": doc_status,
        "review_note": review_note,
        "created_at": doc_created_at,
        "reviewed_at": reviewed_at,
    }
