from typing import Optional
from gotrue.errors import AuthApiError
from fastapi import HTTPException, status
from app.core.supabase import supabase


async def register_user(
    full_name: str,
    email: str,
    password: str,
    age: int,
    gender: str,
    state: str,
    lga: Optional[str] = None
):
    """Registers a user in Supabase Auth with custom profile metadata."""
    try:
        response = supabase.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name,
                        "age": age,
                        "gender": gender,
                        "state": state,
                        "lga": lga,
                    }
                },
            }
        )
        return response
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


async def login_user(email: str, password: str):
    """Authenticates a user with Supabase Auth and returns the session payload."""
    try:
        response = supabase.auth.sign_in_with_password(
            {
                "email": email,
                "password": password
            }
        )
        return response
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


async def logout_user(access_token: Optional[str] = None):
    """Logs out the current session from Supabase Auth."""
    try:
        if access_token:
            # Set session before signing out if operating on a specific user's JWT
            supabase.auth.set_session(access_token, refresh_token="")
        
        response = supabase.auth.sign_out()
        return response
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )(jwt)
