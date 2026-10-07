from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OtpRequestIn(BaseModel):
    identifier: str = Field(min_length=5, max_length=255)  # email or mobile


class OtpVerifyIn(BaseModel):
    identifier: str = Field(min_length=5, max_length=255)
    code: str = Field(min_length=4, max_length=8)


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None
    mobile: str | None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChildIn(BaseModel):
    alias_name: str = Field(min_length=1, max_length=80)
    unique_id: str = Field(min_length=1, max_length=64)
    dob: date


class ChildUpdate(BaseModel):
    alias_name: str | None = Field(default=None, min_length=1, max_length=80)
    unique_id: str | None = Field(default=None, min_length=1, max_length=64)
    dob: date | None = None


class ChildOut(BaseModel):
    id: int
    alias_name: str
    unique_id: str
    dob: date


class PaymentIn(BaseModel):
    child_id: int
    amount: float = Field(ge=0)
    status: Literal["success", "failed", "pending"]
    transaction_id: str | None = Field(default=None, max_length=100)


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    child_id: int
    amount: float
    status: str
    transaction_id: str | None
    timestamp: datetime


class ReminderIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    due_date: date


class ReminderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message: str
    due_date: date
    sent_status: bool


class PushTokenIn(BaseModel):
    push_token: str = Field(max_length=255)
