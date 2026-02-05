from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.db import crud
from app.models.models import ChildMedicalReport, Child as ChildModel, Parent as ParentModel
from app.schemas.schemas import ChildMedicalReport as ChildMedicalReportSchema, ReportTypeEnum
from app.services.report_crypto import ReportCryptoService, EncryptionMetadata
from app.services.report_storage import LocalFilesystemReportStorage


class ChildReportService:
    """High-level service orchestrating DB, encryption, and storage for reports."""

    def __init__(self) -> None:
        self._crypto = ReportCryptoService()
        self._storage = LocalFilesystemReportStorage()

    def _ensure_parent_owns_child(self, db: Session, *, parent: ParentModel, child_id: int) -> ChildModel:
        child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
        if not child:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
        return child

    async def create_report(
        self,
        db: Session,
        *,
        parent: ParentModel,
        child_id: int,
        report_type: ReportTypeEnum,
        upload_file: UploadFile,
        title: Optional[str] = None,
        description: Optional[str] = None,
    ) -> ChildMedicalReportSchema:
        child = self._ensure_parent_owns_child(db, parent=parent, child_id=child_id)

        contents = await upload_file.read()
        if not contents:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploads are not allowed")

        mime_type = upload_file.content_type or "application/octet-stream"

        ciphertext, meta = self._crypto.encrypt_file(contents)

        db_report = ChildMedicalReport(
            child_id=child.child_id,
            report_type=report_type,
            title=title,
            description=description,
            mime_type=mime_type,
            file_size=len(contents),
            storage_path="",  # placeholder until file is saved
            encrypted_dek=meta.encrypted_dek,
            dek_nonce=meta.dek_nonce,
            file_nonce=meta.file_nonce,
        )
        db.add(db_report)
        db.flush()  # to get report_id

        storage_path = self._storage.save(child_id=child.child_id, report_id=db_report.report_id, data=ciphertext)
        db_report.storage_path = storage_path
        db.commit()
        db.refresh(db_report)
        return ChildMedicalReportSchema.model_validate(db_report)

    def list_reports(
        self,
        db: Session,
        *,
        parent: ParentModel,
        child_id: int,
    ) -> List[ChildMedicalReportSchema]:
        child = self._ensure_parent_owns_child(db, parent=parent, child_id=child_id)
        rows = (
            db.query(ChildMedicalReport)
            .filter(ChildMedicalReport.child_id == child.child_id)
            .order_by(ChildMedicalReport.created_at.desc())
            .all()
        )
        return [ChildMedicalReportSchema.model_validate(r) for r in rows]

    def get_report(
        self,
        db: Session,
        *,
        parent: ParentModel,
        child_id: int,
        report_id: int,
    ) -> ChildMedicalReport:
        child = self._ensure_parent_owns_child(db, parent=parent, child_id=child_id)
        row = (
            db.query(ChildMedicalReport)
            .filter(
                ChildMedicalReport.report_id == report_id,
                ChildMedicalReport.child_id == child.child_id,
            )
            .first()
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        return row

    def load_report_bytes(self, report: ChildMedicalReport) -> bytes:
        try:
            ciphertext = self._storage.read_all(report.storage_path)
        except FileNotFoundError:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Encrypted report file missing on server")

        meta = EncryptionMetadata(
            encrypted_dek=report.encrypted_dek,
            dek_nonce=report.dek_nonce,
            file_nonce=report.file_nonce,
        )
        try:
            plaintext = self._crypto.decrypt_file(ciphertext, meta)
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to decrypt report contents")
        return plaintext

    def delete_report(
        self,
        db: Session,
        *,
        parent: ParentModel,
        child_id: int,
        report_id: int,
    ) -> None:
        report = self.get_report(db, parent=parent, child_id=child_id, report_id=report_id)
        self._storage.delete(report.storage_path)
        db.delete(report)
        db.commit()
