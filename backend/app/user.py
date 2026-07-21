from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):

    fullname: str

    email: EmailStr

    password: str


class UserLogin(BaseModel):

    email: EmailStr

    password: str


class Token(BaseModel):

    access_token: str

    from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fullname = Column(String)

    email = Column(
        String,
        unique=True,
        index=True
    )

    password = Column(String)

    token_type: str
