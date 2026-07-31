from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.supabase import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest):
supabase = get_supabase()

```
try:
    response = supabase.auth.sign_up({
        "email": payload.email,
        "password": payload.password,
        "options": {
            "data": {
                "full_name": payload.full_name
            }
        }
    })

    if response.session is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Check email confirmation settings in Supabase."
        )

    return AuthResponse(
        access_token=response.session.access_token,
        refresh_token=response.session.refresh_token,
        token_type="bearer"
    )

except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))
```

@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest):
supabase = get_supabase()

```
try:
    response = supabase.auth.sign_in_with_password({
        "email": payload.email,
        "password": payload.password
    })

    if response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    return AuthResponse(
        access_token=response.session.access_token,
        refresh_token=response.session.refresh_token,
        token_type="bearer"
    )

except Exception:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password"
    )
```
