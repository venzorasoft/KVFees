from unittest.mock import patch

from app.config import settings


def auth(client, ident="a@b.com"):
    r = client.post("/auth/otp/request", json={"identifier": ident})
    assert r.status_code == 200, r.text
    code = r.json()["dev_code"]  # dev/test mode only
    r = client.post("/auth/otp/verify", json={"identifier": ident, "code": code})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_health_ready(client):
    assert client.get("/health").status_code == 200
    assert client.get("/ready").json()["database"] is True


def test_otp_flow(client):
    h = auth(client, "9876543210")
    assert client.get("/children/", headers=h).status_code == 200
    assert client.get("/children/").status_code == 401
    # same mobile in another format maps to the same user; resend is rate-limited
    with patch.object(settings, "otp_resend_seconds", 0):
        r = client.post("/auth/otp/request", json={"identifier": "+91 98765 43210"})
    code = r.json()["dev_code"]
    assert client.post("/auth/otp/request", json={"identifier": "9876543210"}).status_code == 429
    bad = "000000" if code != "000000" else "111111"
    assert client.post("/auth/otp/verify", json={"identifier": "9876543210", "code": bad}).status_code == 401
    assert client.post("/auth/otp/verify", json={"identifier": "9876543210", "code": code}).status_code == 200
    assert client.post("/auth/otp/verify", json={"identifier": "9876543210", "code": code}).status_code == 401  # single use
    assert client.post("/auth/otp/request", json={"identifier": "12"}).status_code == 422


def test_children_crud_and_isolation(client):
    h1, h2 = auth(client, "a@b.com"), auth(client, "c@d.com")
    body = {"alias_name": "Riya", "unique_id": "KV123", "dob": "2014-05-01"}
    r = client.post("/children/", json=body, headers=h1)
    assert r.status_code == 201
    cid = r.json()["id"]
    assert r.json()["unique_id"] == "KV123"
    assert client.post("/children/", json=body, headers=h1).status_code == 409  # duplicate
    assert client.post("/children/", json=body, headers=h2).status_code == 201  # other user OK
    assert client.get(f"/children/{cid}", headers=h2).status_code == 404  # not theirs
    r = client.patch(f"/children/{cid}", json={"alias_name": "Riya K"}, headers=h1)
    assert r.json()["alias_name"] == "Riya K" and r.json()["dob"] == "2014-05-01"
    assert client.delete(f"/children/{cid}", headers=h1).status_code == 204
    assert client.get("/children/", headers=h1).json() == []


def test_payments_and_reminders(client):
    h = auth(client)
    cid = client.post("/children/", json={"alias_name": "R", "unique_id": "X1", "dob": "2014-05-01"}, headers=h).json()["id"]
    r = client.post("/payments/record", json={"child_id": cid, "amount": 1500, "status": "success", "transaction_id": "T1"}, headers=h)
    assert r.status_code == 201
    assert len(client.get("/payments/history", headers=h).json()) == 1
    assert client.post("/payments/record", json={"child_id": 999, "amount": 1, "status": "success"}, headers=h).status_code == 404
    assert client.post("/notifications/", json={"message": "Fees due", "due_date": "2026-12-01"}, headers=h).status_code == 201
    assert len(client.get("/notifications/", headers=h).json()) == 1
