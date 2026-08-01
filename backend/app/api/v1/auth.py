from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise Exception("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")

headers_anon = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
}


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class RefreshPayload(BaseModel):
    refresh_token: str


@router.post("/register")
def register(payload: RegisterPayload):
    url = f"{SUPABASE_URL}/auth/v1/signup"
    body = {"email": payload.email, "password": payload.password}
    resp = requests.post(url, json=body, headers=headers_anon)
    if resp.status_code not in (200, 201):
        # return Supabase error message if available
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    data = resp.json()
    # Supabase signup may return session keys in 'access_token' key
    # Normalize to expected shape:
    access_token = data.get("access_token") or data.get("session", {}).get("access_token")
    refresh_token = data.get("refresh_token") or data.get("session", {}).get("refresh_token")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login")
def login(payload: LoginPayload):
    url = f"{SUPABASE_URL}/auth/v1/token"
    body = {"grant_type": "password", "email": payload.email, "password": payload.password}
    resp = requests.post(url, data=body, headers=headers_anon)
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


@router.post("/refresh")
def refresh(payload: RefreshPayload):
    url = f"{SUPABASE_URL}/auth/v1/token"
    body = {"grant_type": "refresh_token", "refresh_token": payload.refresh_token}
    resp = requests.post(url, data=body, headers=headers_anon)
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=resp.json())
    return resp.json() daya kawai nan
