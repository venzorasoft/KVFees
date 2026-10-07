import logging
import smtplib
from email.message import EmailMessage

from .config import settings

log = logging.getLogger(__name__)


def send_otp(identifier: str, code: str) -> None:
    body = f"Your KV Fee Helper code is {code}. It expires in {settings.otp_ttl_minutes} minutes."
    if settings.otp_provider == "smtp" and "@" in identifier:
        msg = EmailMessage()
        msg["Subject"], msg["From"], msg["To"] = "Your login code", settings.smtp_from, identifier
        msg.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
            s.starttls()
            if settings.smtp_user:
                s.login(settings.smtp_user, settings.smtp_password)
            s.send_message(msg)
        return
    # TODO: SMS provider for mobile numbers. Until then, log the code (development only).
    log.warning("OTP for %s: %s", identifier, code)
