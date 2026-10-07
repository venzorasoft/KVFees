"""Application settings, loaded from environment variables (and `.env` locally).

SQL Server via SQLAlchemy + pyodbc, an optional schema, Alembic migrations
(same layout as the SwitchOn backend, which uses PostgreSQL).
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ---- runtime ----------------------------------------------------------
    environment: Literal["development", "test", "staging", "production"] = "development"
    app_name: str = "KV Fee Helper API"
    version: str = "1.0.0"
    log_level: str = "INFO"
    # 8766 = the Expo web preview (KVFees ports: API 8765, web 8766; SwitchOn uses 8000/8081/5173).
    cors_origins: str = "http://localhost:8766,http://127.0.0.1:8766"

    # ---- database ---------------------------------------------------------
    # SQL Server via pyodbc. Default: local default instance, Windows authentication (no password).
    database_url: str = ("mssql+pyodbc://@localhost/KVFees?driver=ODBC+Driver+17+for+SQL+Server"
                         "&trusted_connection=yes&TrustServerCertificate=yes")
    # Optional schema. Empty = the login's default schema (dbo).
    database_schema: str = ""
    db_pool_size: int = 5
    db_max_overflow: int = 10
    # Create the database if missing and run `alembic upgrade head` on startup (guarded by an app lock).
    migrate_on_start: bool = True

    # ---- auth -------------------------------------------------------------
    jwt_secret: str = Field(default="dev-only-change-me", min_length=16)
    # Long-lived session: parent logs in with OTP once and stays signed in.
    jwt_expire_minutes: int = 60 * 24 * 180
    otp_ttl_minutes: int = 5
    otp_max_attempts: int = 5
    otp_resend_seconds: int = 30
    # Fernet key for child details at rest. Generate with:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    data_encryption_key: str = ""
    # Secret for blind indexes / OTP hashing.
    index_hmac_key: str = "dev-only-change-me-too"

    # ---- providers --------------------------------------------------------
    # "console" logs the OTP (development only); "smtp" emails it. SMS provider: TODO.
    otp_provider: Literal["console", "smtp"] = "console"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    # ---- reminders --------------------------------------------------------
    reminder_days_before: int = 3
    scheduler_enabled: bool = True

    @model_validator(mode="after")
    def _production_guards(self):
        if self.environment == "production":
            if self.jwt_secret.startswith("dev-only") or self.index_hmac_key.startswith("dev-only"):
                raise ValueError("JWT_SECRET and INDEX_HMAC_KEY must be set in production")
            if not self.data_encryption_key:
                raise ValueError("DATA_ENCRYPTION_KEY must be set in production")
            if self.otp_provider == "console":
                raise ValueError("The console OTP provider is not allowed in production")
        return self

    @property
    def dev_mode(self) -> bool:
        """True where developer conveniences (e.g. returning the OTP) are allowed."""
        return self.environment in ("development", "test")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
