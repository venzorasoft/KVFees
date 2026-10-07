from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import current_user
from ..models import Notification, User
from ..schemas import ReminderIn, ReminderOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(body: ReminderIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    n = Notification(user_id=user.id, message=body.message, due_date=body.due_date)
    db.add(n)
    db.commit()
    return n


@router.get("/", response_model=list[ReminderOut])
def list_reminders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.due_date)).all()
