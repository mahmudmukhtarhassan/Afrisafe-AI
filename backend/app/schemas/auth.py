from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
full_name: str = Field(..., min_length=2, max_length=100)
email: EmailStr
age: int = Field(..., ge=1, le=120)
gender: str
state: str
lga: Optional[str] = None
password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
email: EmailStr
password: str

class RefreshTokenRequest(BaseModel):
refresh_token: str

class AuthResponse(BaseModel):
access_token: str
refresh_token: str
token_type: str = "bearer"

class UserOut(BaseModel):
id: int
full_name: str
email: EmailStr
age: int
gender: str
state: str
lga: Optional[str] = None

```
class Config:
    from_attributes = True
```

