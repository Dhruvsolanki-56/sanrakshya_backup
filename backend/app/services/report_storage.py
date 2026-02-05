from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import BinaryIO

from app.core.config import settings


class ReportStorage(ABC):
    """Abstract storage interface for child medical report files.

    A different implementation (e.g. S3/MinIO) can be plugged in without
    changing API contracts.
    """

    @abstractmethod
    def save(self, child_id: int, report_id: int, data: bytes) -> str:
        """Persist encrypted bytes and return a storage_path identifier."""
        raise NotImplementedError

    @abstractmethod
    def read_all(self, storage_path: str) -> bytes:
        """Read all encrypted bytes for a given storage_path."""
        raise NotImplementedError

    @abstractmethod
    def delete(self, storage_path: str) -> None:
        """Delete the stored object if it exists."""
        raise NotImplementedError


class LocalFilesystemReportStorage(ReportStorage):
    """Local filesystem implementation using REPORTS_BASE_DIR.

    Files are stored as:
        {REPORTS_BASE_DIR}/{child_id}/{report_id}.bin
    """

    def __init__(self) -> None:
        self.base_dir = settings.REPORTS_BASE_DIR

    def _full_path(self, storage_path: str) -> str:
        return os.path.join(self.base_dir, storage_path)

    def save(self, child_id: int, report_id: int, data: bytes) -> str:
        rel_dir = os.path.join(str(child_id))
        os.makedirs(os.path.join(self.base_dir, rel_dir), exist_ok=True)
        rel_path = os.path.join(rel_dir, f"{report_id}.bin")
        full_path = self._full_path(rel_path)
        with open(full_path, "wb") as f:
            f.write(data)
        return rel_path

    def read_all(self, storage_path: str) -> bytes:
        full_path = self._full_path(storage_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError("Encrypted report file not found on disk")
        with open(full_path, "rb") as f:
            return f.read()

    def delete(self, storage_path: str) -> None:
        full_path = self._full_path(storage_path)
        try:
            os.remove(full_path)
        except FileNotFoundError:
            return
