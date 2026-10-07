import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import jwt
from cryptography.fernet import Fernet

from .config import settings


def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def _fernet() -> Fernet:
    if not settings.data_encryption_key:
        raise RuntimeError("DATA_ENCRYPTION_KEY is not set")
    return Fernet(settings.data_encryption_key.encode())


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()


def blind_index(user_id: int, unique_id: str, dob: str) -> str:
    """Deterministic keyed hash so we can enforce uniqueness without storing plaintext."""
    msg = f"{user_id}|{unique_id.strip().upper()}|{dob}".encode()
    return hmac.new(settings.index_hmac_key.encode(), msg, hashlib.sha256).hexdigest()
