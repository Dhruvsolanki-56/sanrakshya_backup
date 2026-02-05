from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.apis.deps import get_db, require_doctor_user
from app.doctor.cruds import place as place_crud
from app.doctor.models import (
    Doctor as DoctorModel,
    Place as PlaceModel,
    DoctorPlaceRole,
    DoctorPlaceRoleEnum,
    DoctorPlaceRoleStatusEnum,
    DoctorPlaceRoleDocument,
    DoctorVerificationDocument,
    ReviewStatusEnum,
    AdminOwnerEnum,
)
from app.doctor.schemas import (
    OwnerRoleRequestOut,
    ReviewNoteIn,
    OwnerDoctorOut,
    OwnerRoleDocumentOut,
    OwnerDoctorVerificationDocumentOut,
    OwnerRoleActionOut,
)
from app.doctor.services import doc_storage
from app.core.time import now_ist

router = APIRouter()


def _ensure_owner_access(db: Session, *, current_doctor, place_id: int) -> None:
    place = db.query(PlaceModel).filter(PlaceModel.id == place_id).first()
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if getattr(place, "created_by_doctor", None) != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner who created the place can perform this action")

    owner_role = (
        db.query(DoctorPlaceRole)
        .filter(
            DoctorPlaceRole.place_id == place_id,
            DoctorPlaceRole.doctor_id == current_doctor.doctor_id,
            DoctorPlaceRole.role == DoctorPlaceRoleEnum.OWNER,
            DoctorPlaceRole.status == DoctorPlaceRoleStatusEnum.APPROVED,
        )
        .first()
    )
    if not owner_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an approved owner of the place can perform this action")


def _to_owner_doctor_out(doctor: DoctorModel) -> OwnerDoctorOut:
    return OwnerDoctorOut(
        doctor_id=doctor.doctor_id,
        full_name=doctor.full_name,
        email=doctor.email,
        phone_number=doctor.phone_number,
        specialization=getattr(doctor, "specialization", None),
        registration_number=doctor.registration_number,
        registration_council=doctor.registration_council,
        experience_years=doctor.experience_years,
        qualifications=doctor.qualifications,
        is_verified=bool(getattr(doctor, "is_verified", False)),
        created_at=doctor.created_at,
    )


def _to_owner_role_doc_out(doc: DoctorPlaceRoleDocument) -> OwnerRoleDocumentOut:
    return OwnerRoleDocumentOut(
        id=doc.id,
        doctor_place_role_id=doc.doctor_place_role_id,
        document_type=getattr(doc.document_type, "value", doc.document_type),
        document_name=doc.document_name,
        status=getattr(doc.status, "value", doc.status),
        review_notes=doc.review_notes,
        reviewed_at=doc.reviewed_at,
        created_at=doc.created_at,
    )


def _to_owner_verification_doc_out(doc: DoctorVerificationDocument) -> OwnerDoctorVerificationDocumentOut:
    return OwnerDoctorVerificationDocumentOut(
        id=doc.id,
        doctor_id=doc.doctor_id,
        document_type=getattr(doc.document_type, "value", doc.document_type),
        document_name=doc.document_name,
        status=getattr(doc.status, "value", doc.status),
        review_notes=doc.review_notes,
        reviewed_at=doc.reviewed_at,
        created_at=doc.created_at,
    )


def _get_latest_role_document(db: Session, *, role_id: int) -> DoctorPlaceRoleDocument | None:
    return (
        db.query(DoctorPlaceRoleDocument)
        .filter(DoctorPlaceRoleDocument.doctor_place_role_id == role_id)
        .order_by(DoctorPlaceRoleDocument.created_at.desc())
        .first()
    )


@router.get("/places/{place_id}/role-requests", response_model=list[OwnerRoleRequestOut])
async def list_owner_role_requests(
    place_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)

        rows = (
            db.query(DoctorPlaceRole, DoctorModel, PlaceModel)
            .join(DoctorModel, DoctorModel.doctor_id == DoctorPlaceRole.doctor_id)
            .join(PlaceModel, PlaceModel.id == DoctorPlaceRole.place_id)
            .filter(
                DoctorPlaceRole.place_id == place_id,
                DoctorPlaceRole.status == DoctorPlaceRoleStatusEnum.PENDING,
                DoctorPlaceRole.role != DoctorPlaceRoleEnum.OWNER,
            )
            .order_by(DoctorPlaceRole.id.desc())
            .all()
        )

        out: list[OwnerRoleRequestOut] = []
        for role, doctor, place in rows:
            role_docs = (
                db.query(DoctorPlaceRoleDocument)
                .filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
                .order_by(DoctorPlaceRoleDocument.created_at.desc())
                .all()
            )

            verification_docs = (
                db.query(DoctorVerificationDocument)
                .filter(DoctorVerificationDocument.doctor_id == doctor.doctor_id)
                .order_by(DoctorVerificationDocument.created_at.desc())
                .all()
            )
            out.append(
                OwnerRoleRequestOut(
                    role_id=role.id,
                    place_id=place.id,
                    doctor=_to_owner_doctor_out(doctor),
                    requested_role=role.role,
                    role_status=str(role.status) if not isinstance(role.status, str) else role.status,
                    role_rejection_reason=getattr(role, "suspended_reason", None),
                    attempt_count=len(role_docs),
                    role_documents=[_to_owner_role_doc_out(d) for d in role_docs],
                    doctor_verification_documents=[_to_owner_verification_doc_out(d) for d in verification_docs],
                )
            )
        return out
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/places/{place_id}/roles/{role_id}/documents", response_model=list[OwnerRoleDocumentOut])
async def list_role_documents_for_owner_review(
    place_id: int = Path(..., ge=1),
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        role = db.query(DoctorPlaceRole).filter(DoctorPlaceRole.id == role_id).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        if role.place_id != place_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)

        rows = (
            db.query(DoctorPlaceRoleDocument)
            .filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
            .order_by(DoctorPlaceRoleDocument.created_at.desc())
            .all()
        )
        return [_to_owner_role_doc_out(r) for r in rows]
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/places/{place_id}/roles/{role_id}/review", response_model=OwnerRoleRequestOut)
async def get_role_request_review_bundle(
    place_id: int = Path(..., ge=1),
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)
        role = db.query(DoctorPlaceRole).filter(DoctorPlaceRole.id == role_id, DoctorPlaceRole.place_id == place_id).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

        doctor = db.query(DoctorModel).filter(DoctorModel.doctor_id == role.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

        role_docs = (
            db.query(DoctorPlaceRoleDocument)
            .filter(DoctorPlaceRoleDocument.doctor_place_role_id == role.id)
            .order_by(DoctorPlaceRoleDocument.created_at.desc())
            .all()
        )
        verification_docs = (
            db.query(DoctorVerificationDocument)
            .filter(DoctorVerificationDocument.doctor_id == doctor.doctor_id)
            .order_by(DoctorVerificationDocument.created_at.desc())
            .all()
        )

        return OwnerRoleRequestOut(
            role_id=role.id,
            place_id=place_id,
            doctor=_to_owner_doctor_out(doctor),
            requested_role=role.role,
            role_status=str(role.status) if not isinstance(role.status, str) else role.status,
            role_rejection_reason=getattr(role, "suspended_reason", None),
            attempt_count=len(role_docs),
            role_documents=[_to_owner_role_doc_out(d) for d in role_docs],
            doctor_verification_documents=[_to_owner_verification_doc_out(d) for d in verification_docs],
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/places/{place_id}/role-documents/{doc_id}/file")
async def view_role_document_file(
    place_id: int = Path(..., ge=1),
    doc_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)
        doc = db.query(DoctorPlaceRoleDocument).filter(DoctorPlaceRoleDocument.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        role = db.query(DoctorPlaceRole).filter(DoctorPlaceRole.id == doc.doctor_place_role_id).first()
        if not role or role.place_id != place_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        rel = getattr(doc, "document_url", None)
        if not rel:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")
        abs_path = doc_storage.absolute_path(rel)
        if not abs_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")
        return FileResponse(path=str(abs_path), filename=abs_path.name)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/places/{place_id}/verification-documents/{doc_id}/file")
async def view_doctor_verification_document_file(
    place_id: int = Path(..., ge=1),
    doc_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)
        doc = db.query(DoctorVerificationDocument).filter(DoctorVerificationDocument.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        rel = getattr(doc, "document_url", None)
        if not rel:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")
        abs_path = doc_storage.absolute_path(rel)
        if not abs_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")
        return FileResponse(path=str(abs_path), filename=abs_path.name)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/places/{place_id}/roles/{role_id}/approve", response_model=OwnerRoleActionOut)
async def owner_approve_role_request(
    place_id: int = Path(..., ge=1),
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        role = place_crud.get_role_by_id(db, role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role request not found")
        if role.place_id != place_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role request not found")
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)

        if getattr(role, "role", None) == DoctorPlaceRoleEnum.OWNER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner role cannot be approved via this endpoint")

        if getattr(role, "status", None) != DoctorPlaceRoleStatusEnum.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending role requests can be approved")

        latest_doc = _get_latest_role_document(db, role_id=role.id)
        if not latest_doc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role document is required before approval")

        now = now_ist()
        latest_doc.status = ReviewStatusEnum.APPROVED
        latest_doc.reviewed_by_type = AdminOwnerEnum.OWNER
        latest_doc.reviewed_by = current_doctor.doctor_id
        latest_doc.reviewed_at = now

        place_crud.set_role_approved(db, role, approver_doctor_id=current_doctor.doctor_id)
        return OwnerRoleActionOut(status="ok", role_id=role.id, place_id=place_id)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/places/{place_id}/roles/{role_id}/reject", response_model=OwnerRoleActionOut)
async def owner_reject_role_request(
    body: ReviewNoteIn = Body(default_factory=ReviewNoteIn),
    place_id: int = Path(..., ge=1),
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        role = place_crud.get_role_by_id(db, role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role request not found")
        if role.place_id != place_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role request not found")
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)

        if getattr(role, "status", None) == DoctorPlaceRoleStatusEnum.REJECTED:
            return OwnerRoleActionOut(status="ok", role_id=role.id, place_id=place_id)

        if getattr(role, "status", None) != DoctorPlaceRoleStatusEnum.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending role requests can be rejected")

        latest_doc = _get_latest_role_document(db, role_id=role.id)
        if latest_doc:
            now = now_ist()
            latest_doc.status = ReviewStatusEnum.REJECTED
            latest_doc.reviewed_by_type = AdminOwnerEnum.OWNER
            latest_doc.reviewed_by = current_doctor.doctor_id
            latest_doc.reviewed_at = now
            latest_doc.review_notes = body.review_notes

        now = now_ist()
        role.status = DoctorPlaceRoleStatusEnum.REJECTED
        role.changed_by = current_doctor.doctor_id
        role.changed_at = now
        role.approved_by_type = AdminOwnerEnum.OWNER
        role.suspended_reason = body.review_notes
        db.add(role)
        db.commit()
        db.refresh(role)
        return OwnerRoleActionOut(status="ok", role_id=role.id, place_id=place_id)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/places/{place_id}/roles/{role_id}/resubmission", response_model=OwnerRoleActionOut)
async def owner_request_resubmission_for_role_document(
    body: ReviewNoteIn = Body(default_factory=ReviewNoteIn),
    place_id: int = Path(..., ge=1),
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        role = place_crud.get_role_by_id(db, role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role request not found")
        if role.place_id != place_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role request not found")
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)

        if getattr(role, "role", None) == DoctorPlaceRoleEnum.OWNER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner role cannot be reviewed via this endpoint")

        if getattr(role, "status", None) != DoctorPlaceRoleStatusEnum.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending role requests can be sent for resubmission")

        latest_doc = _get_latest_role_document(db, role_id=role.id)
        if not latest_doc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role document is required before requesting resubmission")

        now = now_ist()
        latest_doc.status = ReviewStatusEnum.REJECTED
        latest_doc.reviewed_by_type = AdminOwnerEnum.OWNER
        latest_doc.reviewed_by = current_doctor.doctor_id
        latest_doc.reviewed_at = now
        latest_doc.review_notes = body.review_notes

        role.changed_by = current_doctor.doctor_id
        role.changed_at = now
        role.approved_by_type = AdminOwnerEnum.OWNER
        db.add(role)
        db.commit()
        db.refresh(role)
        return OwnerRoleActionOut(status="ok", role_id=role.id, place_id=place_id)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.delete("/places/{place_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def owner_remove_doctor_from_workplace(
    place_id: int = Path(..., ge=1),
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        role = place_crud.get_role_by_id(db, role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        if role.place_id != place_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        _ensure_owner_access(db, current_doctor=current_doctor, place_id=place_id)

        if getattr(role, "role", None) == DoctorPlaceRoleEnum.OWNER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner role cannot be removed")

        if getattr(role, "status", None) != DoctorPlaceRoleStatusEnum.APPROVED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only approved workplace members can be removed")

        if getattr(role, "doctor_id", None) == current_doctor.doctor_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot remove themselves")

        now = now_ist()
        role.status = DoctorPlaceRoleStatusEnum.REMOVED
        role.changed_by = current_doctor.doctor_id
        role.changed_at = now
        role.approved_by_type = AdminOwnerEnum.OWNER
        db.add(role)
        db.commit()
        return
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
