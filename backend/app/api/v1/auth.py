from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.core.supabase import supabase
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import (
    register_user,
    login_user,
    logout_user,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

# -----------------------------
# Register
# -----------------------------
@router.post("/register")
async def register(data: RegisterRequest):
    try:
        result = await register_user(
            data.full_name,
            data.email,
            data.password,
        )

        return {
            "message": "Registration successful",
            "user": result.user,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------
# Login
# -----------------------------
@router.post("/login")
async def login(data: LoginRequest):
    try:
        session = await login_user(
            data.email,
            data.password,
        )

        return {
            "access_token": session.session.access_token,
            "refresh_token": session.session.refresh_token,
            "user": session.user,
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# -----------------------------
# Refresh Token
# -----------------------------
class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_token(data: RefreshRequest):
    try:
        session = supabase.auth.refresh_session(
            data.refresh_token
        )

        return {
            "access_token": session.session.access_token,
            "refresh_token": session.session.refresh_token,
        }

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Refresh failed: {str(e)}",
        )


# -----------------------------
# Logout
# -----------------------------
@router.post("/logout")
async def logout(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")

        await logout_user(token)

        return {
            "message": "Logged out successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
