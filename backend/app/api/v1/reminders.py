"""
Reminders router for AfriSafe AI (Render backend).
Stores and retrieves user reminders in Supabase.
Note: The 'reminders' table is not yet in the database — these endpoints
will return a 503 until the table is created. The frontend currently
uses local notifications only, so this is safe.
"""
import os
import requests
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Reminders"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REST_URL = f"{SUPABASE_URL}/rest/v1"

service_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


class ReminderCreate(BaseModel):
    title: str
    reminder_date: str


def get_user_id_from_request(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return resp.json().get("id")


@router.post("")
def create_reminder(data: ReminderCreate, request: Request):
    user_id = get_user_id_from_request(request)
    record = {
        "user_id": user_id,
        "title": data.title,
        "reminder_date": data.reminder_date,
    }
    url = f"{REST_URL}/reminders"
    resp = requests.post(url, json=record, headers=service_headers)
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reminders table not available. Using local notifications instead.",
        )
    return {"success": True, "data": resp.json()}


@router.get("")
def list_reminders(request: Request):
    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/reminders?user_id=eq.{user_id}&order=reminder_date.asc"
    resp = requests.get(url, headers=service_headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reminders table not available. Using local notifications instead.",
        )
    return {"success": True, "data": resp.json()}
