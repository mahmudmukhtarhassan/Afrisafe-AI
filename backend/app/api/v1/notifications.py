import os
import requests
from fastapi import APIRouter, HTTPException, Request, status
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Notifications"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REST_URL = f"{SUPABASE_URL}/rest/v1"

service_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


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


@router.get("")
def list_notifications(request: Request):
    user_id = get_user_id_from_request(request)

    url = f"{REST_URL}/notifications?user_id=eq.{user_id}&order=created_at.desc"
    resp = requests.get(url, headers=service_headers)

    if resp.status_code == 200:
        return {"success": True, "data": resp.json()}

    demo_notifications = [
        {
            "id": 1,
            "title": "Malaria Prevention Reminder",
            "message": "Use your insecticide-treated bed net tonight.",
            "type": "reminder",
            "read": False,
            "created_at": "2026-08-07T20:00:00"
        },
        {
            "id": 2,
            "title": "Assessment Completed",
            "message": "Your latest AI malaria assessment has been saved successfully.",
            "type": "assessment",
            "read": False,
            "created_at": "2026-08-07T18:30:00"
        },
        {
            "id": 3,
            "title": "Stay Protected",
            "message": "Remove stagnant water around your home to reduce mosquito breeding.",
            "type": "prevention",
            "read": True,
            "created_at": "2026-08-06T09:00:00"
        }
    ]

    return {"success": True, "data": demo_notifications}


@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: int, request: Request):
    get_user_id_from_request(request)
    return {
        "success": True,
        "message": f"Notification {notification_id} marked as read."
    }
