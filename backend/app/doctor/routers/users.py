from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.apis.deps import get_db, require_doctor_user
from app.doctor.services import doctor_service
from app.doctor.schemas import DoctorHomeOut

router = APIRouter()


@router.get("/doctor-home", response_model=DoctorHomeOut)
async def read_doctor_home(
    db: Session = Depends(get_db),
    current_doctor=Depends(require_doctor_user),
):
    try:
        return doctor_service.get_doctor_home(db=db, current_doctor=current_doctor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
