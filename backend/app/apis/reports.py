from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.apis.deps import get_current_user, get_db
from app.models.models import Parent as ParentModel
from app.schemas.schemas import ChildMedicalReport as ChildMedicalReportSchema, ReportTypeEnum
from app.services.report_service import ChildReportService


router = APIRouter()
_service = ChildReportService()


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can manage reports")
    return user


@router.post(
    "/children/{child_id}/reports",
    response_model=ChildMedicalReportSchema,
    status_code=status.HTTP_201_CREATED,
)
async def upload_child_report(
    child_id: int,
    report_type: ReportTypeEnum = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")
    return await _service.create_report(
        db,
        parent=parent,
        child_id=child_id,
        report_type=report_type,
        upload_file=file,
        title=title,
        description=description,
    )


@router.get(
    "/children/{child_id}/reports",
    response_model=List[ChildMedicalReportSchema],
)
async def list_child_reports(
    child_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    return _service.list_reports(db, parent=parent, child_id=child_id)


@router.get(
    "/children/{child_id}/reports/{report_id}",
    response_class=StreamingResponse,
)
async def get_child_report(
    child_id: int,
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    report = _service.get_report(db, parent=parent, child_id=child_id, report_id=report_id)
    plaintext = _service.load_report_bytes(report)

    async def file_iterator():
        yield plaintext

    return StreamingResponse(file_iterator(), media_type=report.mime_type)


@router.delete(
    "/children/{child_id}/reports/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_child_report(
    child_id: int,
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    _service.delete_report(db, parent=parent, child_id=child_id, report_id=report_id)
    return None
