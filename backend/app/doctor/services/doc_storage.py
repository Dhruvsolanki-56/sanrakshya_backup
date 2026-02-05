from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.core.config import settings


def get_base_dir() -> Path:
    # Store under a common 'verification' base, with subfolders for doctors and places
    base = Path(settings.REPORTS_BASE_DIR) / "verification"
    base.mkdir(parents=True, exist_ok=True)
    return base


def save_upload_to_path(relative_path: str, upload: UploadFile) -> Path:
    base = get_base_dir()
    target = base / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("wb") as f:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    return target


def build_verification_path(doctor_id: int, doc_id: int, original_filename: Optional[str]) -> str:
    ext = ""
    if original_filename and "." in original_filename:
        ext = "." + original_filename.split(".")[-1].lower()
    # doctor verification documents
    return f"doctors/{doctor_id}/{doc_id}{ext}"


def build_role_doc_path(place_id: int, role_id: int, doc_id: int, original_filename: Optional[str]) -> str:
    ext = ""
    if original_filename and "." in original_filename:
        ext = "." + original_filename.split(".")[-1].lower()
    # place verification documents (role-based)
    return f"places/{place_id}/roles/{role_id}/{doc_id}{ext}"


def absolute_path(relative_path: str) -> Path:
    return get_base_dir() / relative_path
