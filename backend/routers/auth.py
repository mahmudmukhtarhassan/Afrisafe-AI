from fastapi import APIRouter, HTTPException

from app.schemas.user import (
    UserRegister,
    UserLogin
)

from app.auth.password import (
    hash_password,
    verify_password
)

from app.auth.jwt import create_access_token

from app.database import users

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")

def register(user: UserRegister):

    for u in users:
        if u["email"] == user.email:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

    new_user = {
        "fullname": user.fullname,
        "email": user.email,
        "password": hash_password(user.password)
    }

    users.append(new_user)

    return {
        "message": "Registration successful"
    }


@router.post("/login")

def login(user: UserLogin):

    for u in users:

        if u["email"] == user.email:

            if verify_password(
                user.password,
                u["password"]
            ):

                token = create_access_token(
                    {"sub": u["email"]}
                )

                return {
                    "access_token": token,
                    "token_type": "bearer"
                }

    raise HTTPException(
        status_code=401,
        detail="Invalid email or password"
    )
