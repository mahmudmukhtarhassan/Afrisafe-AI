"""SQLAlchemy ORM models."""

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    """Registered application user."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assessments: Mapped[list["Assessment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Assessment(Base):
    """A single malaria triage assessment record.

    ``user_id`` is nullable to allow guest assessments to be persisted
    (when explicitly requested) without an owning account.
    """

    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    symptoms_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    prediction_result: Mapped[dict] = mapped_column(JSON, nullable=False)
    triage_level: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User | None] = relationship(back_populates="assessments")
