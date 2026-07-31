from fastapi import APIRouter, HTTPException
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.core.supabase import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
supabase = get_supabase()

```
result = supabase.auth.sign_up({
    "email": payload.email,
    "password": payload.password,
    "options": {
        "data": {
            "full_name": payload.full_name,
            "age": payload.age,
            "gender": payload.gender,
            "state": payload.state,
            "lga": payload.lga,
        }
    }
})

if result.session is None:
    raise HTTPException(status_code=400, detail="Registration failed")

return AuthResponse(
    access_token=result.session.access_token,
    refresh_token=result.session.refresh_token,
)
```

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
supabase = get_supabase()

```
result = supabase.auth.sign_in_with_password({
    "email": payload.email,
    "password": payload.password,
})

if result.session is None:
    raise HTTPException(status_code=401, detail="Incorrect email or password")

return AuthResponse(
    access_token=result.session.access_token,
    refresh_token=result.session.refresh_token,
)
```

