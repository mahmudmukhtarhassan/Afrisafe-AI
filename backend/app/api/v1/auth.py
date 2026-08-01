import os
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr

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
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    
    data = resp.json()
    
    # Safely extract session if auto-confirm is enabled in Supabase
    session = data.get("session") or {}
    access_token = data.get("access_token") or session.get("access_token")
    refresh_token = data.get("refresh_token") or session.get("refresh_token")
    
    return {
        "message": "User registered successfully. Check your email if confirmation is required.",
        "user_id": data.get("id") or data.get("user", {}).get("id"),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login")
def login(payload: LoginPayload):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    body = {"email": payload.email, "password": payload.password}
    
    # FIXED: Changed `data=body` to `json=body`
    resp = requests.post(url, json=body, headers=headers_anon)
    
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
        "user": data.get("user")
    }


@router.post("/refresh")
def refresh(payload: RefreshPayload):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
    body = {"refresh_token": payload.refresh_token}
    
    # FIXED: Changed `data=body` to `json=body`
    resp = requests.post(url, json=body, headers=headers_anon)
    
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
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
        
    return resp.json()
