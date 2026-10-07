from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    # Filtered unique indexes: SQL Server treats NULLs as equal in a plain UNIQUE constraint,
    # which would allow only one email-less (or mobile-less) user.
    __table_args__ = (
        Index("uq_users_email", "email", unique=True, mssql_where=text("email IS NOT NULL")),
        Index("uq_users_mobile", "mobile", unique=True, mssql_where=text("mobile IS NOT NULL")),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    email: Mapped[str | None] = mapped_column(String(255))
    mobile: Mapped[str | None] = mapped_column(String(20))
    push_token: Mapped[str | None] = mapped_column(String(255))

    children: Mapped[list["Child"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    identifier: Mapped[str] = mapped_column(String(255), index=True)  # normalized email or mobile
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Child(Base):
    __tablename__ = "children"
    __table_args__ = (UniqueConstraint("user_id", "lookup_hash", name="uq_child_per_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    alias_name: Mapped[str] = mapped_column(String(80))
    unique_id_enc: Mapped[str] = mapped_column(String(512))  # Fernet ciphertext
    dob_enc: Mapped[str] = mapped_column(String(512))  # Fernet ciphertext
    lookup_hash: Mapped[str] = mapped_column(String(64))  # blind index

    user: Mapped[User] = relationship(back_populates="children")
    payments: Mapped[list["Payment"]] = relationship(back_populates="child", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    child_id: Mapped[int] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20))  # success | failed | pending
    transaction_id: Mapped[str | None] = mapped_column(String(100))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    child: Mapped[Child] = relationship(back_populates="payments")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str] = mapped_column(String(500))
    due_date: Mapped[date] = mapped_column(Date)
    sent_status: Mapped[bool] = mapped_column(default=False)
