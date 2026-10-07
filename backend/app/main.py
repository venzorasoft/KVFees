"""KV Fee Helper API (FastAPI + PostgreSQL).

    uvicorn app.main:app --reload               # development
    gunicorn app.main:app -c gunicorn.conf.py   # production container

Docs at /docs (development only).
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .db import ping
from .routers import auth, children, notifications, payments, portal

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logging.basicConfig(level=settings.log_level)
    if settings.migrate_on_start and settings.environment != "test":
        from .migrate import upgrade
        upgrade()
    sched = None
    if settings.scheduler_enabled and settings.environment != "test":
        from . import scheduler
        sched = scheduler.start()
    yield
    if sched:
        sched.shutdown(wait=False)


app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan,
              docs_url="/docs" if settings.dev_mode else None, redoc_url=None,
              openapi_url="/openapi.json" if settings.dev_mode else None)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
for r in (auth.router, children.router, payments.router, notifications.router, portal.router):
    app.include_router(r)


@app.get("/health", tags=["meta"], summary="Liveness")
def health():
    return {"status": "ok", "version": settings.version}


@app.get("/ready", tags=["meta"], summary="Readiness: the database is reachable")
def ready():
    ok = ping()
    return JSONResponse({"status": "ready" if ok else "degraded", "database": ok}, status_code=200 if ok else 503)
