from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Path
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.apis.deps import get_db, require_doctor_user
from app.doctor.services import documents_service
from app.doctor.schemas import (
    DoctorVerificationDocumentOut,
    VerificationDocumentTypeEnum,
    DoctorVerificationStatusOut,
    DoctorPlaceRoleDocumentOut,
)

router = APIRouter()


@router.post("/verification", response_model=DoctorVerificationDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_verification_document(
    document_type: VerificationDocumentTypeEnum = Form(...),
    document_name: str = Form(..., min_length=1, max_length=200),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return documents_service.upload_verification_document(
            db,
            current_doctor=current_doctor,
            document_type=document_type,
            document_name=document_name,
            file=file,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/roles/place/{place_id}/documents", response_model=list[DoctorPlaceRoleDocumentOut])
async def list_role_documents_for_place(
    place_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return documents_service.get_role_documents_for_doctor_place(
            db,
            current_doctor=current_doctor,
            place_id=place_id,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/verification", response_model=list[DoctorVerificationDocumentOut])
async def list_verification_documents(
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return documents_service.list_verification_documents(db, current_doctor=current_doctor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/verification/status", response_model=DoctorVerificationStatusOut)
async def get_verification_status(
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return documents_service.get_doctor_verification_status(db, current_doctor=current_doctor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


