from sqlalchemy import Boolean, Column, DateTime, Integer, String
from datetime import datetime

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(120), unique=True, index=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    phone = Column(String(30), nullable=True)

    state = Column(String(100), nullable=True)

    is_active = Column(Boolean, default=True)

    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
