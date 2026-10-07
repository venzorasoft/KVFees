import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..deps import current_user
from ..models import OtpCode, User
from ..otp_sender import send_otp
from ..schemas import OtpRequestIn, OtpVerifyIn, ProfileIn, PushTokenIn, TokenOut, UserOut
from ..security import create_token

router = APIRouter(tags=["auth"])


def _normalize(identifier: str) -> tuple[str, bool]:
    """Return (normalized identifier, is_email). Accepts an email or a 10-digit Indian mobile."""
    v = identifier.strip().lower()
    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
        return v, True
    digits = re.sub(r"\D", "", v)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 10:
        return digits, False
    raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Enter a valid email or 10-digit mobile number")


def _hash(identifier: str, code: str) -> str:
    return hmac.new(settings.index_hmac_key.encode(), f"{identifier}|{code}".encode(), hashlib.sha256).hexdigest()


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.post("/auth/otp/request")
def request_otp(body: OtpRequestIn, db: Session = Depends(get_db)):
    ident, _ = _normalize(body.identifier)
    now = datetime.now(timezone.utc)
    last = db.scalar(select(OtpCode).where(OtpCode.identifier == ident).order_by(OtpCode.id.desc()))
    if last and (now - _aware(last.created_at)).total_seconds() < settings.otp_resend_seconds:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Please wait before requesting another code")
    code = f"{secrets.randbelow(10**6):06d}"
    db.execute(delete(OtpCode).where(OtpCode.identifier == ident))
    db.add(OtpCode(identifier=ident, code_hash=_hash(ident, code), expires_at=now + timedelta(minutes=settings.otp_ttl_minutes)))
    db.commit()
    send_otp(ident, code)
    # Development convenience (like the SwitchOn API): hand the code back so you can test without SMS/email.
    return {"sent": True, **({"dev_code": code} if settings.dev_mode else {})}


@router.post("/auth/otp/verify", response_model=TokenOut)
def verify_otp(body: OtpVerifyIn, db: Session = Depends(get_db)):
    ident, is_email = _normalize(body.identifier)
    otp = db.scalar(select(OtpCode).where(OtpCode.identifier == ident).order_by(OtpCode.id.desc()))
    bad = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired code")
    if not otp or _aware(otp.expires_at) < datetime.now(timezone.utc) or otp.attempts >= settings.otp_max_attempts:
        raise bad
    if not hmac.compare_digest(otp.code_hash, _hash(ident, body.code.strip())):
        otp.attempts += 1
        db.commit()
        raise bad
    db.delete(otp)  # single use
    col = User.email if is_email else User.mobile
    user = db.scalar(select(User).where(col == ident))
    if not user:
        user = User(email=ident if is_email else None, mobile=None if is_email else ident)
        db.add(user)
    db.commit()
    return TokenOut(access_token=create_token(user.id))


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.patch("/users/me", response_model=UserOut)
def update_me(body: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.name = body.name.strip()
    db.commit()
    return user


@router.put("/users/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
def set_push_token(body: PushTokenIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.push_token = body.push_token
    db.commit()
