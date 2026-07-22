from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import hash_password, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, payload: UserRegister) -> User:
        # Duba ko email yana nan a DB
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        
        new_user = User(
            full_name=payload.full_name,
            email=payload.email,
            hashed_password=hash_password(payload.password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, payload: UserLogin) -> str:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        return access_token
