from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings


@dataclass
class EncryptionMetadata:
    encrypted_dek: str
    dek_nonce: str
    file_nonce: str


class ReportCryptoService:
    """Handles AES-256-GCM envelope encryption for child medical report files.

    - A single master key (KEK) is loaded from settings.REPORTS_MASTER_KEY.
    - For each file, a random 32-byte DEK is generated.
    - The DEK is encrypted with the KEK using AES-256-GCM.
    - The file contents are encrypted with the DEK using AES-256-GCM.
    """

    def __init__(self) -> None:
        try:
            master_key_bytes = base64.urlsafe_b64decode(settings.REPORTS_MASTER_KEY)
        except Exception as exc:  # pragma: no cover - misconfiguration
            raise RuntimeError("Invalid REPORTS_MASTER_KEY: must be URL-safe base64") from exc
        if len(master_key_bytes) != 32:
            raise RuntimeError("REPORTS_MASTER_KEY must decode to 32 bytes for AES-256-GCM")
        self._master_key = master_key_bytes

    def _encrypt_dek(self, dek: bytes) -> Tuple[str, str]:
        """Encrypt the per-file DEK using the master key.

        Returns (encrypted_dek_b64, dek_nonce_b64).
        """
        nonce = os.urandom(12)
        aesgcm = AESGCM(self._master_key)
        ciphertext = aesgcm.encrypt(nonce, dek, None)
        return (
            base64.urlsafe_b64encode(ciphertext).decode("ascii"),
            base64.urlsafe_b64encode(nonce).decode("ascii"),
        )

    def _decrypt_dek(self, encrypted_dek_b64: str, dek_nonce_b64: str) -> bytes:
        """Decrypt the per-file DEK using the master key."""
        aesgcm = AESGCM(self._master_key)
        nonce = base64.urlsafe_b64decode(dek_nonce_b64.encode("ascii"))
        ciphertext = base64.urlsafe_b64decode(encrypted_dek_b64.encode("ascii"))
        return aesgcm.decrypt(nonce, ciphertext, None)

    def encrypt_file(self, plaintext: bytes) -> Tuple[bytes, EncryptionMetadata]:
        """Encrypt file bytes using a fresh DEK and AES-256-GCM.

        Returns (ciphertext, EncryptionMetadata).
        """
        dek = os.urandom(32)
        enc_dek_b64, dek_nonce_b64 = self._encrypt_dek(dek)

        file_nonce = os.urandom(12)
        file_aesgcm = AESGCM(dek)
        ciphertext = file_aesgcm.encrypt(file_nonce, plaintext, None)

        meta = EncryptionMetadata(
            encrypted_dek=enc_dek_b64,
            dek_nonce=dek_nonce_b64,
            file_nonce=base64.urlsafe_b64encode(file_nonce).decode("ascii"),
        )
        return ciphertext, meta

    def decrypt_file(self, ciphertext: bytes, meta: EncryptionMetadata) -> bytes:
        """Decrypt file bytes using stored encryption metadata."""
        dek = self._decrypt_dek(meta.encrypted_dek, meta.dek_nonce)
        file_nonce = base64.urlsafe_b64decode(meta.file_nonce.encode("ascii"))
        file_aesgcm = AESGCM(dek)
        return file_aesgcm.decrypt(file_nonce, ciphertext, None)
