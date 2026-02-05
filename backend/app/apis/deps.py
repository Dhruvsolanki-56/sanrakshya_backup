from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_access_token
from app.db import crud
from app.models.models import Parent
from app.doctor.cruds import doctor as doctor_crud
from app.schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
  
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if email is None or user_type is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_type=user_type)
    except Exception:
        raise credentials_exception

    if token_data.user_type == "doctor":
        user = doctor_crud.get_doctor_by_email(db, email=token_data.email)
    elif token_data.user_type == "parent":
        user = crud.get_parent_by_email(db, email=token_data.email)
    else:
        raise credentials_exception

    if user is None:
        raise credentials_exception
    return user


async def require_doctor_user(current_user = Depends(get_current_user)):
    if isinstance(current_user, Parent):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can perform this action")
    return current_user
