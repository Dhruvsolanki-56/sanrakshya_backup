from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.schemas.schemas import Child, ChildCreate, ChildUpdate
from app.models.models import Parent as ParentModel
from app.services import profile_photo_storage

router = APIRouter()


def _require_parent(user):
    # current_user can be Parent ORM or Doctor ORM; ensure it's a Parent
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can manage children")
    return user


@router.get("/list-children", response_model=List[Child])
def list_my_children(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    return crud.list_children_by_parent(db, parent_id=parent.parent_id)


@router.post("/create-child", response_model=Child, status_code=status.HTTP_201_CREATED)
def create_my_child(
    payload: ChildCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    return crud.create_child(db, parent_id=parent.parent_id, child=payload)


@router.get("/get-child/{child_id}", response_model=Child)
def get_my_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return db_child


@router.put("/update-child/{child_id}", response_model=Child)
def update_my_child(
    child_id: int,
    updates: ChildUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return crud.update_child(db, db_child=db_child, updates=updates)


@router.delete("/delete-child/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    crud.delete_child(db, db_child=db_child)
    return None


@router.post("/{child_id}/photo", status_code=status.HTTP_201_CREATED)
async def upload_child_photo(
    child_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")
    if not (file.content_type or "").lower().startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image uploads are allowed")

    rel_path = profile_photo_storage.build_child_photo_path(child_id, file.filename)
    profile_photo_storage.save_upload_to_path(rel_path, file)

    abs_path = profile_photo_storage.absolute_path(rel_path)
    size = abs_path.stat().st_size if abs_path.exists() else None
    crud.upsert_child_profile_photo(
        db,
        child_id=child_id,
        photo_url=rel_path,
        mime_type=file.content_type,
        file_size=size,
    )
    return {"photo_url": f"/children/{child_id}/photo"}


@router.get("/{child_id}/photo", response_class=StreamingResponse)
async def get_child_photo(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    row = crud.get_child_profile_photo(db, child_id=child_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child photo not found")

    path = profile_photo_storage.absolute_path(row.photo_url)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child photo file missing on server")

    def file_iterator():
        with path.open("rb") as f:
            yield from iter(lambda: f.read(1024 * 1024), b"")

    return StreamingResponse(file_iterator(), media_type=row.mime_type or "application/octet-stream")


@router.delete("/{child_id}/photo", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child_photo(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    row = crud.get_child_profile_photo(db, child_id=child_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child photo not found")

    profile_photo_storage.delete_relative_path(row.photo_url)
    crud.delete_child_profile_photo(db, child_id=child_id)
    return None
