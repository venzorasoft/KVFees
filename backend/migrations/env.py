"""Alembic environment. Connection settings come from the app's Settings, or from
`config.attributes["connection"]` when a caller (startup migrator, tests) passes one."""
from alembic import context

from app import models  # noqa: F401 - registers every table
from app.config import get_settings
from app.db import Base, make_engine

target_metadata = Base.metadata
config = context.config


def _schema() -> str:
    return config.attributes.get("schema", get_settings().database_schema) or ""


def include_name(name, type_, parent_names) -> bool:
    if type_ == "schema":
        return name == (_schema() or None)
    # Alembic's own bookkeeping table is never part of the app schema.
    return not (type_ == "table" and name == "alembic_version")


def _configure(**kw) -> None:
    context.configure(target_metadata=target_metadata, version_table_schema=_schema() or None,
                      compare_type=True, include_schemas=bool(_schema()), include_name=include_name, **kw)


def run_offline() -> None:
    _configure(url=get_settings().database_url, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_online() -> None:
    conn = config.attributes.get("connection")
    if conn is not None:
        _configure(connection=conn)
        with context.begin_transaction():
            context.run_migrations()
        return
    engine = make_engine(get_settings().database_url)
    with engine.connect() as connection:
        _configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()
        connection.commit()
    engine.dispose()


if context.is_offline_mode():
    run_offline()
else:
    run_online()
