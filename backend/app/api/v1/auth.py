from fastapi import APIRouter, HTTPException, Header

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
            "user": result.user
        }

    except Exception as e:
        raise HTTPException(400, str(e))


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
        raise HTTPException(401, str(e))


@router.post("/logout")
async def logout(authorization: str = Header()):

    token = authorization.replace("Bearer ", "")

    await logout_user(token)

    return {"message": "Logged out"}

from pydantic import BaseModel

class RefreshRequest(BaseModel):
    refresh_token: str
from app.core.supabase import supabase
@router.post("/refresh")
async def refresh_token(data: RefreshRequest):
    try:
        session = supabase.auth.refresh_session(data.refresh_token)
        return {
            "access_token": session.session.access_token,
            "refresh_token": session.session.refresh_token,
        }
    except Exception as e:
        raise HTTPException(401, str(e))
