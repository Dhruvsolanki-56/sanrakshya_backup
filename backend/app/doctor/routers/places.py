from fastapi import APIRouter, Depends, HTTPException, status, Path, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.apis.deps import get_db, require_doctor_user
from app.doctor.services import place_service
from app.doctor.services import documents_service
from app.doctor.schemas import (
    Place,
    PlaceCreate,
    PlaceRoleRequest,
    DoctorPlaceRoleOut,
    DoctorPlaceRoleDocumentOut,
    RoleDocumentTypeEnum,
    PlaceSummary,
    AddressCreate,
    DoctorPlaceRoleEnum,
    PlaceWithAddress,
)

router = APIRouter()


@router.post("/create_place", response_model=Place, status_code=status.HTTP_201_CREATED)
async def create_place_for_doctor(
    place: PlaceCreate,
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return place_service.create_place(db=db, current_doctor=current_doctor, place=place)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/{place_id}", response_model=PlaceWithAddress)
async def get_place(
    place_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return place_service.get_place_detail(db=db, place_id=place_id)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/enroll", response_model=Place, status_code=status.HTTP_201_CREATED)
async def enroll_place(
    role: DoctorPlaceRoleEnum = Form(...),
    existing_place_id: int | None = Form(None),
    # Fields for new place (when existing_place_id is not provided)
    name: str | None = Form(None),
    type: str | None = Form(None),
    official_phone: str | None = Form(None),
    address_line1: str | None = Form(None),
    address_line2: str | None = Form(None),
    address_area_locality: str | None = Form(None),
    address_city: str | None = Form(None),
    address_state: str | None = Form(None),
    address_pincode: str | None = Form(None),
    address_country: str | None = Form("India"),
    # Single document
    doc_type: RoleDocumentTypeEnum = Form(...),
    doc_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        addr = None
        if not existing_place_id:
            # Build AddressCreate if any address field provided
            if any([address_line1, address_city, address_state, address_pincode]):
                addr = AddressCreate(
                    line1=address_line1 or "",
                    line2=address_line2,
                    area_locality=address_area_locality,
                    city=address_city or "",
                    state=address_state or "",
                    pincode=address_pincode or "",
                    country=address_country or "India",
                )
        return place_service.enroll_place_with_role_and_docs(
            db,
            current_doctor=current_doctor,
            existing_place_id=existing_place_id,
            name=name,
            type_str=type,
            official_phone=official_phone,
            address_in=addr,
            role=role,
            doc_type=doc_type,
            doc_name=doc_name,
            file=file,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("", response_model=list[PlaceSummary])
async def list_places(
    q: str | None = Query(None, min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return place_service.list_places(db=db, q=q, limit=limit)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/roles/{role_id}/documents", response_model=DoctorPlaceRoleDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_role_document(
    role_id: int = Path(..., ge=1),
    document_type: RoleDocumentTypeEnum = Form(...),
    document_name: str = Form(..., min_length=1, max_length=200),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return documents_service.upload_role_document(
            db,
            current_doctor=current_doctor,
            role_id=role_id,
            document_type=document_type,
            document_name=document_name,
            file=file,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/{place_id}/roles", response_model=DoctorPlaceRoleOut, status_code=status.HTTP_201_CREATED)
async def request_place_role(
    req: PlaceRoleRequest,
    place_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return place_service.request_role(db=db, current_doctor=current_doctor, place_id=place_id, req=req)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/roles/{role_id}/approve", response_model=DoctorPlaceRoleOut)
async def approve_place_role(
    role_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return place_service.approve_role(db=db, current_doctor=current_doctor, role_id=role_id)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
