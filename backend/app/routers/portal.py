"""Local-machine helper for the browser preview.

A web page cannot fill in another website's form, so for the browser build the API opens the
bank portal in a real browser window on the machine it runs on, fills the child's details and
leaves the captcha + payment to the parent. Enabled only in development; on phones the app's
own WebView does the filling.
"""
import json
import subprocess
import sys

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..deps import current_user
from ..models import Child, User
from ..security import decrypt

router = APIRouter(prefix="/portal", tags=["portal"])


class LaunchIn(BaseModel):
    child_id: int


@router.post("/launch", status_code=status.HTTP_202_ACCEPTED)
def launch(body: LaunchIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not settings.dev_mode:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not available")
    child = db.get(Child, body.child_id)
    if not child or child.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Child not found")
    payload = json.dumps({"unique_id": decrypt(child.unique_id_enc), "dob": decrypt(child.dob_enc)})
    proc = subprocess.Popen([sys.executable, "-m", "app.portal_helper"], stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True)
    proc.stdin.write(payload)
    proc.stdin.close()
    return {"opened": True}
