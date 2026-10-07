"""Test harness: a real SQL Server database built by the Alembic migrations (so the
migrations are tested too), emptied before every test.

Configure with TEST_DATABASE_URL (from the environment or .env). The database name
must contain "test"; the default is a local KVFees_Test with Windows authentication."""
import os
import pathlib
import re

import pytest

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_TEST_URL = ("mssql+pyodbc://@localhost/KVFees_Test?driver=ODBC+Driver+17+for+SQL+Server"
                    "&trusted_connection=yes&TrustServerCertificate=yes")


def _dotenv() -> dict:
    env = {}
    path = ROOT / ".env"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\s*([A-Z_]+)\s*=\s*(.*)\s*$", line)
            if m:
                env[m.group(1)] = m.group(2).strip()
    return env


_env = _dotenv()
TEST_URL = os.environ.get("TEST_DATABASE_URL") or _env.get("TEST_DATABASE_URL") or DEFAULT_TEST_URL
TEST_SCHEMA = os.environ.get("TEST_DATABASE_SCHEMA", _env.get("TEST_DATABASE_SCHEMA", ""))
if "test" not in TEST_URL.split("?")[0].rsplit("/", 1)[-1].lower():
    raise RuntimeError("Refusing to run: the test database name must contain 'test'")

os.environ.update({
    "ENVIRONMENT": "test", "DATABASE_URL": TEST_URL, "DATABASE_SCHEMA": TEST_SCHEMA, "MIGRATE_ON_START": "false",
    "OTP_PROVIDER": "console", "JWT_SECRET": "test-secret-0123456789abcdef",
    "DATA_ENCRYPTION_KEY": "Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyMTI=",
})

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import db as app_db  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.db import Base, ensure_database, make_engine  # noqa: E402
from app.main import app  # noqa: E402
from app.migrate import upgrade  # noqa: E402

get_settings.cache_clear()


@pytest.fixture(scope="session")
def engine():
    ensure_database(TEST_URL)
    eng = make_engine(TEST_URL)
    Base.metadata.drop_all(eng)
    with eng.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS " + (f"[{TEST_SCHEMA}]." if TEST_SCHEMA else "") + "alembic_version"))
    upgrade(TEST_URL, TEST_SCHEMA)
    app_db.set_engine(eng)
    yield eng
    eng.dispose()


@pytest.fixture(autouse=True)
def clean(engine):
    with engine.begin() as conn:
        for t in reversed(Base.metadata.sorted_tables):  # children before parents (FKs)
            conn.execute(t.delete())
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
