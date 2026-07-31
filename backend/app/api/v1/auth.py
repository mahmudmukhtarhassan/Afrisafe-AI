from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
# Adjust this import to wherever your Supabase helper lives:
# e.g., from app.core.supabase import get_supabase

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest):
    try:
        # Example Supabase initialization/call:
        # supabase = get_supabase()
        # response = supabase.auth.sign_up({"email": payload.email, "password": payload.password})
        
        return {"message": "User registered successfully", "email": payload.email}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest):
    try:
        # Example Supabase login call:
        # supabase = get_supabase()
        # response = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
        
        return {
            "access_token": "mock_token_here",
            "token_type": "bearer",
            "user_id": "user_id_here"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
