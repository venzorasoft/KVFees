"""Create the database/schema if needed and run Alembic migrations, safely from any number of instances.

    python -m app.migrate            # upgrade to head

An SQL Server application lock (sp_getapplock) serialises concurrent runs."""
import logging
import pathlib

from alembic import command
from alembic.config import Config
from sqlalchemy import text

from .config import get_settings
from .db import ensure_database, make_engine

LOCK_RESOURCE = "kvfees-migrate"
ROOT = pathlib.Path(__file__).resolve().parent.parent
log = logging.getLogger("kvfees.migrate")


def upgrade(url: str | None = None, schema: str | None = None) -> None:
    s = get_settings()
    url, schema = url or s.database_url, s.database_schema if schema is None else schema
    ensure_database(url)
    engine = make_engine(url)
    with engine.connect() as conn:
        conn.execute(text("EXEC sp_getapplock @Resource=:r, @LockMode='Exclusive', @LockOwner='Session', "
                          "@LockTimeout=60000"), {"r": LOCK_RESOURCE})
        try:
            if schema:
                conn.execute(text(f"IF SCHEMA_ID(N'{schema}') IS NULL EXEC('CREATE SCHEMA [{schema}]')"))
            cfg = Config(str(ROOT / "alembic.ini"))
            cfg.set_main_option("script_location", str(ROOT / "migrations"))
            cfg.attributes["connection"] = conn
            cfg.attributes["schema"] = schema
            command.upgrade(cfg, "head")
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.execute(text("EXEC sp_releaseapplock @Resource=:r, @LockOwner='Session'"), {"r": LOCK_RESOURCE})
            conn.commit()
    engine.dispose()
    log.info("database schema is up to date")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    upgrade()
