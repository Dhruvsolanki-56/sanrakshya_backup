from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.apis.deps import get_db
from app.doctor.services import doctor_service
from app.doctor.services import auth_service
from app.doctor.schemas import Doctor, DoctorCreate
from app.schemas.schemas import Token, UserLogin

router = APIRouter()


@router.post("/register-doctor", response_model=Doctor, status_code=status.HTTP_201_CREATED)
def register_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    try:
        return doctor_service.register_doctor(db=db, doctor=doctor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/doctor-login", response_model=Token)
async def login_for_access_token_doctor(user_login: UserLogin, db: Session = Depends(get_db)):
    try:
        return auth_service.login_doctor(db=db, email=user_login.email, password=user_login.password)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
