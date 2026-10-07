from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import current_user
from ..models import Child, Payment, User
from ..schemas import PaymentIn, PaymentOut

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/record", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(body: PaymentIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    child = db.get(Child, body.child_id)
    if not child or child.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Child not found")
    payment = Payment(child_id=child.id, amount=body.amount, status=body.status, transaction_id=body.transaction_id)
    db.add(payment)
    db.commit()
    return payment


@router.get("/history", response_model=list[PaymentOut])
def history(child_id: int | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    q = select(Payment).join(Child).where(Child.user_id == user.id).order_by(Payment.timestamp.desc())
    if child_id is not None:
        q = q.where(Payment.child_id == child_id)
    return db.scalars(q).all()
