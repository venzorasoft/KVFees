from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import current_user
from ..models import Child, User
from ..schemas import ChildIn, ChildOut, ChildUpdate
from ..security import blind_index, decrypt, encrypt

router = APIRouter(prefix="/children", tags=["children"])


def _out(c: Child) -> ChildOut:
    return ChildOut(id=c.id, alias_name=c.alias_name, unique_id=decrypt(c.unique_id_enc), dob=decrypt(c.dob_enc))


def _owned(db: Session, user: User, child_id: int) -> Child:
    child = db.get(Child, child_id)
    if not child or child.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Child not found")
    return child


@router.post("/", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def create_child(body: ChildIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    dob = body.dob.isoformat()
    child = Child(
        user_id=user.id,
        alias_name=body.alias_name,
        unique_id_enc=encrypt(body.unique_id.strip()),
        dob_enc=encrypt(dob),
        lookup_hash=blind_index(user.id, body.unique_id, dob),
    )
    db.add(child)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This child is already saved")
    return _out(child)


@router.get("/", response_model=list[ChildOut])
def list_children(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Child).where(Child.user_id == user.id).order_by(Child.id))
    return [_out(c) for c in rows]


@router.get("/{child_id}", response_model=ChildOut)
def get_child(child_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _out(_owned(db, user, child_id))


@router.patch("/{child_id}", response_model=ChildOut)
def update_child(child_id: int, body: ChildUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    child = _owned(db, user, child_id)
    unique_id = body.unique_id.strip() if body.unique_id else decrypt(child.unique_id_enc)
    dob = body.dob.isoformat() if body.dob else decrypt(child.dob_enc)
    if body.alias_name:
        child.alias_name = body.alias_name
    child.unique_id_enc = encrypt(unique_id)
    child.dob_enc = encrypt(dob)
    child.lookup_hash = blind_index(user.id, unique_id, dob)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This child is already saved")
    return _out(child)


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(child_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(_owned(db, user, child_id))
    db.commit()
