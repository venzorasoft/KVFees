"""Daily job: send Expo push notifications for reminders due within the configured window."""
import logging
from datetime import date, timedelta

import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import select

from .config import settings
from .db import session_factory
from .models import Notification, User

log = logging.getLogger(__name__)
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_due_reminders() -> int:
    cutoff = date.today() + timedelta(days=settings.reminder_days_before)
    sent = 0
    with session_factory()() as db:
        rows = db.execute(
            select(Notification, User)
            .join(User, User.id == Notification.user_id)
            .where(Notification.sent_status.is_(False), Notification.due_date <= cutoff)
        ).all()
        for n, user in rows:
            if not user.push_token:
                continue
            try:
                httpx.post(
                    EXPO_PUSH_URL,
                    json={"to": user.push_token, "title": "Fee due soon", "body": n.message},
                    timeout=10,
                ).raise_for_status()
            except httpx.HTTPError:
                log.exception("push failed for notification %s", n.id)
                continue
            n.sent_status = True
            sent += 1
        db.commit()
    return sent


def start() -> BackgroundScheduler:
    sched = BackgroundScheduler()
    sched.add_job(send_due_reminders, "cron", hour=9, minute=0)
    sched.start()
    return sched
