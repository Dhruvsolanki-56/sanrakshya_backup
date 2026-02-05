from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.apis.deps import get_current_user, get_db
from app.db import crud
from app.db import crud_chatbot
from app.models.models import Parent as ParentModel
from app.services.bal_mitra import ask_bal_mitra


router = APIRouter()


class BalMitraChatRequest(BaseModel):
    question: str


class BalMitraChatResponse(BaseModel):
    answer: str


def _require_parent(user):
    if not isinstance(user, ParentModel):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access Bal Mitra",
        )
    return user


@router.post("/child/{child_id}", response_model=BalMitraChatResponse)
def chat_with_bal_mitra(
    child_id: int,
    payload: BalMitraChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    parent = _require_parent(current_user)
    db_child = crud.get_child_by_id_and_parent(db, child_id=child_id, parent_id=parent.parent_id)
    if not db_child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    today = date.today()
    age_years = (today - db_child.date_of_birth).days / 365.25
    if age_years < 0 or age_years > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bal Mitra is designed for children between 0 and 10 years of age",
        )
    context = crud_chatbot.get_child_chatbot_context(db, child_id=child_id)
    try:
        answer_text = ask_bal_mitra(question=payload.question, child_context=context)
    except Exception:
        answer_text = (
            "Bal Mitra faced an unexpected technical issue while answering this question. "
            "Please try again later, and contact your child's pediatrician for any urgent "
            "or serious concerns."
        )
    return BalMitraChatResponse(answer=answer_text)
