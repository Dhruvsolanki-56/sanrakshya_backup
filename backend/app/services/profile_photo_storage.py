from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.core.config import settings


def get_base_dir() -> Path:
    base = Path(settings.REPORTS_BASE_DIR) / "profile_photos"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _safe_ext_from_filename(original_filename: Optional[str]) -> str:
    if not original_filename or "." not in original_filename:
        return ""
    ext = original_filename.split(".")[-1].lower()
    if not ext or len(ext) > 10:
        return ""
    return "." + ext


def build_parent_photo_path(parent_id: int, original_filename: Optional[str]) -> str:
    ext = _safe_ext_from_filename(original_filename)
    return f"parents/{parent_id}/profile{ext}"


def build_child_photo_path(child_id: int, original_filename: Optional[str]) -> str:
    ext = _safe_ext_from_filename(original_filename)
    return f"children/{child_id}/profile{ext}"


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


def absolute_path(relative_path: str) -> Path:
    return get_base_dir() / relative_path


def delete_relative_path(relative_path: str) -> None:
    path = absolute_path(relative_path)
    try:
        path.unlink()
    except FileNotFoundError:
        return
