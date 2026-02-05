from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.core.time import now_ist
from app.doctor.cruds import doctor as doctor_crud


def login_doctor(db: Session, *, email: str, password: str) -> dict:
    try:
        result = doctor_crud.get_doctor_and_auth_by_email(db, email=email)
        user_type = "doctor"

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You are not registered as a doctor",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user, auth = result

        if not verify_password(password, auth.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        auth.last_login = now_ist()
        db.add(auth)
        db.commit()

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expires_at_utc = datetime.utcnow() + access_token_expires
        expires_at_ist = expires_at_utc.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo("Asia/Kolkata"))
        access_token = create_access_token(
            data={"sub": user.email, "user_type": user_type},
            expires_delta=access_token_expires,
        )
        return {"access_token": access_token, "token_type": "bearer", "expires_at": expires_at_ist}
    except HTTPException:
        raise
