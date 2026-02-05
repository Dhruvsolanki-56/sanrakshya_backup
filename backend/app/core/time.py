from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo


def now_ist(*, naive: bool = True) -> datetime:
    """Return current time in Asia/Kolkata.

    If naive=True (default), tzinfo is stripped to match typical DB TIMESTAMP columns.
    """

    dt = datetime.now(ZoneInfo("Asia/Kolkata"))
    return dt.replace(tzinfo=None) if naive else dt
