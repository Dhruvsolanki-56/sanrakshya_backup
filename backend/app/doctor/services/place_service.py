from datetime import datetime

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.doctor.cruds import place as place_crud
from app.doctor.schemas import (
    PlaceCreate,
    PlaceRoleRequest,
    DoctorPlaceRoleOut,
    DoctorPlaceRoleEnum,
    AddressCreate,
    RoleDocumentTypeEnum as SchemaRoleDocType,
    PlaceWithAddress,
    Address,
)
from app.doctor.models import (
    DoctorPlaceRoleStatusEnum,
    PlaceTypeEnum,
    Place as PlaceModel,
    DoctorPlaceRole,
    DoctorPlaceRoleDocument,
    RoleDocumentTypeEnum as ModelRoleDocType,
    Address as AddressModel,
)
from app.doctor.services import doc_storage


def create_place(db: Session, current_doctor, place: PlaceCreate):
    # Validate place type
    try:
        place_type = PlaceTypeEnum(place.type) if not isinstance(place.type, PlaceTypeEnum) else place.type
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid place type")

    # If a place with same name and type already exists, do not create duplicate
    existing_place = place_crud.get_place_by_name_and_type(db, name=place.name, place_type=place_type)
    if existing_place:
        raise HTTPException(
            status_code=400,
            detail="Place already exists. Use the role request endpoint to join this place.",
        )

    # Resolve address if provided
    address_id = None
    if place.address is not None:
        address = place_crud.get_or_create_address(db, address_in=place.address)
        address_id = address.id

    # New place as OWNER-managed clinic
    if place.role == DoctorPlaceRoleEnum.OWNER:
        return place_crud.create_place_for_doctor(db=db, doctor_id=current_doctor.doctor_id, place=place, address_id=address_id)

    # New provisional place with consulting doctor (no owner yet)
    if place.role == DoctorPlaceRoleEnum.CONSULTING:
        db_place = PlaceModel(
            name=place.name,
            type=place_type,
            is_verified=False,
            created_by_doctor=current_doctor.doctor_id,
            address_id=address_id,
        )
        db.add(db_place)
        db.commit()
        db.refresh(db_place)

        # Create a pending consulting role for this doctor at the new place
        place_crud.create_role_request(db, current_doctor.doctor_id, db_place.id, DoctorPlaceRoleEnum.CONSULTING)
        return db_place

    # Any other role type is not allowed at creation time
    raise HTTPException(
        status_code=400,
        detail="Unsupported role for new place. Use OWNER or CONSULTING, or use the role request endpoint for existing places.",
    )


def request_role(db: Session, current_doctor, place_id: int, req: PlaceRoleRequest) -> DoctorPlaceRoleOut:
    place = place_crud.get_place_by_id(db, place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    if req.role == DoctorPlaceRoleEnum.OWNER:
        raise HTTPException(status_code=400, detail="Owner role cannot be requested")

    existing = place_crud.get_role_for_doctor_place(db, current_doctor.doctor_id, place_id)
    if existing:
        if getattr(existing, "status", None) == DoctorPlaceRoleStatusEnum.REJECTED:
            raise HTTPException(
                status_code=403,
                detail="Your previous role request for this place was rejected; re-enrollment is not allowed",
            )
        if existing.status == DoctorPlaceRoleStatusEnum.APPROVED:
            raise HTTPException(status_code=400, detail="Role already approved for this place")
        else:
            raise HTTPException(status_code=400, detail="Role request already pending for this place")

    role = place_crud.create_role_request(db, current_doctor.doctor_id, place_id, req.role)
    return role


def approve_role(db: Session, current_doctor, role_id: int) -> DoctorPlaceRoleOut:
    role = place_crud.get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role request not found")

    # Ensure current doctor is an approved owner of the place
    owners = place_crud.get_owner_roles(db, role.place_id)
    owner_ids = {o.doctor_id for o in owners}
    if current_doctor.doctor_id not in owner_ids:
        raise HTTPException(status_code=403, detail="Only an owner of the place can approve role requests")

    if getattr(role, "role", None) == DoctorPlaceRoleEnum.OWNER:
        raise HTTPException(status_code=400, detail="Owner role cannot be approved via this endpoint")

    if getattr(role, "status", None) == DoctorPlaceRoleStatusEnum.APPROVED:
        return role

    return place_crud.set_role_approved(db, role, approver_doctor_id=current_doctor.doctor_id)


def get_workplaces_for_doctor(db: Session, current_doctor):
    return place_crud.get_workplaces_for_doctor(db, doctor_id=current_doctor.doctor_id)


def list_places(db: Session, q: str | None = None, limit: int = 10):
    query = db.query(PlaceModel)

    if q:
        # Case-insensitive partial match on name
        ilike_pattern = f"%{q}%"
        query = query.filter(PlaceModel.name.ilike(ilike_pattern))

    query = query.order_by(PlaceModel.name.asc()).limit(limit)
    return query.all()


def get_place_detail(db: Session, place_id: int) -> PlaceWithAddress:
    place = db.query(PlaceModel).filter(PlaceModel.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    address_schema = None
    if getattr(place, "address_id", None):
        db_address = db.query(AddressModel).filter(AddressModel.id == place.address_id).first()
        if db_address is not None:
            # Map ORM address to Pydantic Address schema explicitly
            address_schema = Address(
                line1=db_address.line1,
                line2=db_address.line2,
                area_locality=db_address.area_locality,
                city=db_address.city,
                state=db_address.state,
                pincode=db_address.pincode,
                country=db_address.country,
            )

    # Build response model explicitly with public fields only
    return PlaceWithAddress(
        id=place.id,
        name=place.name,
        type=str(place.type) if not isinstance(place.type, str) else place.type,
        is_verified=bool(place.is_verified),
        address=address_schema,
    )


def enroll_place_with_role_and_docs(
    db: Session,
    *,
    current_doctor,
    existing_place_id: int | None,
    name: str | None,
    type_str: str | None,
    official_phone: str | None,
    address_in: AddressCreate | None,
    role: DoctorPlaceRoleEnum,
    doc_type: SchemaRoleDocType,
    doc_name: str,
    file: UploadFile,
):
    # Validate doc input
    if not file:
        raise HTTPException(status_code=400, detail="Document file is required")

    saved_paths: list[str] = []
    try:
        # Select existing place
        if existing_place_id:
            place = place_crud.get_place_by_id(db, existing_place_id)
            if not place:
                raise HTTPException(status_code=404, detail="Place not found")
            # Owner only one
            if role == DoctorPlaceRoleEnum.OWNER:
                owners = place_crud.get_owner_roles(db, place.id)
                if owners:
                    raise HTTPException(status_code=400, detail="This place already has an owner")
        else:
            # Create new place: require name/type/address/official_phone
            if not name or not type_str:
                raise HTTPException(status_code=400, detail="Name and type are required for new place")
            try:
                place_type = PlaceTypeEnum(type_str) if not isinstance(type_str, PlaceTypeEnum) else type_str
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid place type")

            # Avoid duplicates by name+type
            if place_crud.get_place_by_name_and_type(db, name=name, place_type=place_type):
                raise HTTPException(status_code=400, detail="Place already exists, select it instead")

            if role not in (DoctorPlaceRoleEnum.OWNER, DoctorPlaceRoleEnum.CONSULTING, DoctorPlaceRoleEnum.ASSISTANT):
                raise HTTPException(status_code=400, detail="Unsupported role for new place")

            # Address required for new place
            if not address_in or not address_in.line1 or not address_in.city or not address_in.state or not address_in.pincode:
                raise HTTPException(status_code=400, detail="Address (line1, city, state, pincode) is required for new place")

            # Official phone required for new place
            if not official_phone:
                raise HTTPException(status_code=400, detail="Official phone is required for new place")

            addr = place_crud.get_or_create_address(db, address_in=address_in)

            place = PlaceModel(
                name=name,
                type=place_type,
                is_verified=False,
                created_by_doctor=current_doctor.doctor_id,
                address_id=addr.id,
                official_phone=official_phone,
            )
            db.add(place)
            db.flush()

        # Ensure no duplicate role for doctor at this place
        existing_role = place_crud.get_role_for_doctor_place(db, current_doctor.doctor_id, place.id)
        if existing_role:
            if getattr(existing_role, "status", None) == DoctorPlaceRoleStatusEnum.REJECTED:
                raise HTTPException(
                    status_code=403,
                    detail="Your previous role request for this place was rejected; re-enrollment is not allowed",
                )
            raise HTTPException(status_code=400, detail="You already have a role (or pending request) for this place")

        # Create role with PENDING status (to be approved by Admin/Owner)
        role_enum = role if isinstance(role, DoctorPlaceRoleEnum) else DoctorPlaceRoleEnum(role)
        db_role = DoctorPlaceRole(
            doctor_id=current_doctor.doctor_id,
            place_id=place.id,
            role=role_enum,
            status=DoctorPlaceRoleStatusEnum.PENDING,
        )
        db.add(db_role)
        db.flush()

        # Upload single document (role doc)
        model_type = ModelRoleDocType(doc_type.value) if not isinstance(doc_type, ModelRoleDocType) else doc_type
        doc_row = DoctorPlaceRoleDocument(
            doctor_place_role_id=db_role.id,
            document_type=model_type,
            document_name=doc_name,
            document_url="",
        )
        db.add(doc_row)
        db.flush()

        rel_path = doc_storage.build_role_doc_path(place.id, db_role.id, doc_row.id, file.filename)
        # save to filesystem
        abs_path = doc_storage.save_upload_to_path(rel_path, file)
        saved_paths.append(str(abs_path))

        # update url
        doc_row.document_url = rel_path
        db.add(doc_row)

        # Final commit once
        db.commit()
        # refresh place for response
        db.refresh(place)
        return place
    except HTTPException:
        # cleanup files then rollback and re-raise
        for p in saved_paths:
            try:
                from pathlib import Path
                Path(p).unlink(missing_ok=True)
            except Exception:
                pass
        db.rollback()
        raise
    except Exception:
        for p in saved_paths:
            try:
                from pathlib import Path
                Path(p).unlink(missing_ok=True)
            except Exception:
                pass
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
