from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db import crud
from app.schemas.schemas import ParentCreate, Token, UserLogin, Parent
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.apis.deps import get_db

router = APIRouter()

@router.post("/register-parent", response_model=Parent, status_code=status.HTTP_201_CREATED)
def register_parent(parent: ParentCreate, db: Session = Depends(get_db)):
    # uniqueness across all parents, including inactive ones
    db_parent = crud.get_parent_by_email_any(db, email=parent.email)
    if db_parent:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_parent_phone = crud.get_parent_by_phone_any(db, phone_number=parent.phone_number)
    if db_parent_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    return crud.create_parent(db=db, parent=parent)

@router.post("/parent-login", response_model=Token)
async def login_for_access_token_parent(user_login: UserLogin, db: Session = Depends(get_db)):

    user = crud.get_parent_by_email(db, email=user_login.email)
    user_type = "parent"

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not registered as a parent",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expires_at_utc = datetime.utcnow() + access_token_expires
    expires_at_ist = expires_at_utc.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo("Asia/Kolkata"))
    access_token = create_access_token(
        data={"sub": user.email, "user_type": user_type},
        expires_delta=access_token_expires
    )
    print(user_type)
    return {"access_token": access_token, "token_type": "bearer", "expires_at": expires_at_ist}