"""SQL Server wiring (SQLAlchemy 2 + pyodbc): one engine per process, one session per request."""
from collections.abc import Iterator

from sqlalchemy import MetaData, create_engine, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

# Deterministic constraint names keep Alembic migrations stable.
NAMING = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    # Optional schema (DATABASE_SCHEMA); empty = the login's default schema (dbo).
    metadata = MetaData(naming_convention=NAMING, schema=get_settings().database_schema or None)


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def make_engine(url: str, **kw) -> Engine:
    return create_engine(url, pool_pre_ping=True, fast_executemany=True, **kw)


def ensure_database(url: str) -> None:
    """Create the target database if it doesn't exist (needs dbcreator; skipped quietly otherwise)."""
    u = make_url(url)
    name = u.database
    if not name:
        return
    master = create_engine(u.set(database="master"), isolation_level="AUTOCOMMIT")
    try:
        with master.connect() as conn:
            conn.execute(text(f"IF DB_ID(N'{name}') IS NULL CREATE DATABASE [{name}]"))
    except Exception:  # noqa: BLE001 - the migration will report a real connection problem
        pass
    finally:
        master.dispose()


def get_engine() -> Engine:
    global _engine, _session_factory
    if _engine is None:
        s = get_settings()
        _engine = make_engine(s.database_url, pool_size=s.db_pool_size, max_overflow=s.db_max_overflow)
        _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def set_engine(engine: Engine) -> None:
    """Point the app at another engine (used by the test-suite)."""
    global _engine, _session_factory
    _engine = engine
    _session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def session_factory() -> sessionmaker[Session]:
    get_engine()
    assert _session_factory is not None
    return _session_factory


def get_db() -> Iterator[Session]:
    db = session_factory()()
    try:
        yield db
    finally:
        db.close()


def ping() -> bool:
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 - reported by /ready
        return False
