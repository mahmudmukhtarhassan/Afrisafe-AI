import os
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Do not raise at import time — allow the app to start even if env vars are missing.
# Endpoints will return clear HTTP errors when called if configuration is incomplete.

headers_anon = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
}

class RegisterPayload(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str | None = Field(default=None, max_length=100)
    age: int | None = None
    gender: str | None = None
    state: str | None = None

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class RefreshPayload(BaseModel):
    refresh_token: str

def _normalize_user(user: dict) -> dict:
    if not user:
        return {}

    metadata = user.get("user_metadata") or {}

    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "full_name": metadata.get("full_name"),
        "age": metadata.get("age"),
        "gender": metadata.get("gender"),
        "state": metadata.get("state"),
        "phone": metadata.get("phone"),
        "role": user.get("role") or "user",
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
    }

def _fetch_profile(user_id: str) -> dict | None:
    if not SUPABASE_SERVICE_ROLE_KEY:
        return None

    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=5)

        if resp.status_code == 200:
            rows = resp.json()
            return rows[0] if rows else None

    except Exception:
        pass

    return None

def _merge_user_profile(auth_user: dict) -> dict:
    base = _normalize_user(auth_user)
    profile = _fetch_profile(base.get("id"))

    if profile:
        for key in ("full_name", "age", "gender", "state", "phone"):
            value = profile.get(key)

            if value is not None:
                base[key] = value

    return base

@router.post("/register")
def register(payload: RegisterPayload):
    url = f"{SUPABASE_URL}/auth/v1/signup"

    body = {
        "email": payload.email,
        "password": payload.password,
        "data": {
            "full_name": payload.full_name,
            "age": payload.age,
            "gender": payload.gender,
            "state": payload.state,
        },
    }

    try:
        resp = requests.post(url, json=body, headers=headers_anon, timeout=10)
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}"
        )

    if resp.status_code not in (200, 201):
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text

        error_status = status.HTTP_400_BAD_REQUEST if resp.status_code >= 400 else status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=error_status, detail=detail)

    data = resp.json()

    session = data.get("session") or {}

    access_token = data.get("access_token") or session.get("access_token")
    refresh_token = data.get("refresh_token") or session.get("refresh_token")

    user = data.get("user") or {}

    user_id = user.get("id")

    # Create user profile in the database with UPSERT via PUT
    if user_id and SUPABASE_SERVICE_ROLE_KEY:
        profile_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"

        profile_body = {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "age": payload.age,
            "gender": payload.gender,
            "state": payload.state,
        }

        headers_with_auth = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }

        try:
            # Use POST for upsert (safer than PUT with merge-duplicates)
            profile_resp = requests.post(
                profile_url,
                json=profile_body,
                headers=headers_with_auth,
                timeout=5,
            )
            # Log profile creation errors but don't fail registration
            if profile_resp.status_code not in (200, 201):
                print(f"Profile creation warning: {profile_resp.status_code} - {profile_resp.text}")

        except Exception as e:
            # Profile creation should not block registration
            print(f"Profile creation error: {str(e)}")

    return {
        "message": "User registered successfully.",
        "user": _normalize_user(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/login")
def login(payload: LoginPayload):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"

    body = {
        "email": payload.email,
        "password": payload.password,
    }

    try:
        resp = requests.post(url, json=body, headers=headers_anon, timeout=10)
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}"
        )

    if resp.status_code != 200:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    data = resp.json()

    if not data.get("access_token"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or authentication service error"
        )

    return {
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
        "token_type": data.get("token_type", "bearer"),
        "user": _merge_user_profile(data.get("user")),
    }

@router.post("/refresh")
def refresh(payload: RefreshPayload):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"

    body = {
        "refresh_token": payload.refresh_token,
    }

    try:
        resp = requests.post(url, json=body, headers=headers_anon, timeout=10)
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}"
        )

    if resp.status_code != 200:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    data = resp.json()

    return {
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
        "token_type": data.get("token_type", "bearer"),
    }

@router.get("/me")
def me(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    url = f"{SUPABASE_URL}/auth/v1/user"

    headers = {
        "Authorization": auth_header,
        "apikey": SUPABASE_ANON_KEY,
    }

    try:
        resp = requests.get(url, headers=headers, timeout=10)
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}"
        )

    if resp.status_code != 200:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        )

    return _merge_user_profile(resp.json())
