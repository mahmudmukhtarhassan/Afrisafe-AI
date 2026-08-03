"""
Users router for AfriSafe AI (Render backend).
Provides:
  GET  /me           -> merged auth + profile data for the current user
  PUT  /profile      -> update editable profile fields (name, age, gender, state, phone)
  PUT  /password    -> change password (delegates to Supabase Auth admin API)
"""
import os
import requests
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Users"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REST_URL = f"{SUPABASE_URL}/rest/v1"

service_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    age: int | None = None
    gender: str | None = None
    state: str | None = None
    phone: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


def get_user_id_from_request(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return resp.json().get("id")


def _merge_profile(auth_user: dict, profile: dict | None) -> dict:
    """Merge auth.users data with the profiles row."""
    metadata = auth_user.get("user_metadata") or {}
    p = profile or {}
    return {
        "id": auth_user.get("id"),
        "email": auth_user.get("email"),
        "full_name": p.get("full_name") or metadata.get("full_name"),
        "age": p.get("age") if p.get("age") is not None else metadata.get("age"),
        "gender": p.get("gender") or metadata.get("gender"),
        "state": p.get("state") or metadata.get("state"),
        "phone": p.get("phone"),
        "role": (auth_user.get("role") or "user"),
        "is_active": auth_user.get("is_active", True),
        "created_at": auth_user.get("created_at"),
    }


def _fetch_profile(user_id: str) -> dict | None:
    url = f"{REST_URL}/profiles?id=eq.{user_id}"
    resp = requests.get(url, headers=service_headers)
    if resp.status_code != 200:
        return None
    rows = resp.json()
    return rows[0] if rows else None


@router.get("/me")
def me(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    auth_user = resp.json()
    profile = _fetch_profile(auth_user.get("id"))
    return _merge_profile(auth_user, profile)


@router.put("/profile")
def update_profile(payload: ProfileUpdate, request: Request):
    user_id = get_user_id_from_request(request)

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No updatable fields provided.",
        )

    # Upsert into profiles (insert if missing, update if exists)
    url = f"{REST_URL}/profiles?id=eq.{user_id}"
    body = {"id": user_id, **updates}
    resp = requests.patch(url, json=body, headers=service_headers)
    if resp.status_code not in (200, 204):
        # Row may not exist yet — try insert
        url = f"{REST_URL}/profiles"
        resp = requests.post(url, json=body, headers=service_headers)
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=resp.text,
            )

    # Also update auth user_metadata so /auth/me stays consistent
    meta_url = f"{SUPABASE_URL}/auth/v1/user"
    meta_headers = {
        "Authorization": request.headers.get("Authorization"),
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    meta_body = {"data": updates}
    requests.put(meta_url, json=meta_body, headers=meta_headers)

    profile = _fetch_profile(user_id)
    auth_user_resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"Authorization": request.headers.get("Authorization"), "apikey": SUPABASE_ANON_KEY},
    )
    auth_user = auth_user_resp.json() if auth_user_resp.status_code == 200 else {}
    return _merge_profile(auth_user, profile)


@router.put("/password")
def change_password(payload: PasswordChange, request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    # Use Supabase Auth admin API to update the user's password.
    # We verify the current password by attempting a login first.
    user_info_resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY},
    )
    if user_info_resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_email = user_info_resp.json().get("email")

    # Verify current password
    login_resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": user_email, "password": payload.current_password},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
    )
    if login_resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters.",
        )

    # Update password via admin API
    user_id = user_info_resp.json().get("id")
    admin_url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
    admin_headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    admin_body = {"password": payload.new_password}
    resp = requests.put(admin_url, json=admin_body, headers=admin_headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password.",
        )

    return {"message": "Password changed successfully."}
