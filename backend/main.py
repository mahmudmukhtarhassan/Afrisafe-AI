"""FastAPI entry point for the AfriSafe AI backend.

Run with::

    uvicorn backend.main:app --reload
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import create_access_token, decode_token, hash_password, verify_password
from config import settings
from database import Base, engine, get_db
from models import Assessment, User
from schemas import (
    AssessmentHistoryItem,
    AssessmentRequest,
    AssessmentResponse,
    HealthResponse,
    MessageResponse,
    PredictionResult,
    Token,
    UserLogin,
    UserOut,
    UserRegister,
)
from services.ml_service import ml_model
from services.triage import triage_assessment

logger = logging.getLogger("afrisafe")
logging.basicConfig(level=logging.INFO)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# ---------------------------------------------------------------------------
# Lifespan: create tables, load ML model
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    Base.metadata.create_all(bind=engine)
    try:
        ml_model.load()
    except RuntimeError as exc:
        logger.error("Model load failed: %s", exc)
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered malaria symptom triage helper API.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the Bearer token.

    Raises 401 if the token is missing, malformed, or the user no longer exists.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exc

    subject = decode_token(token)
    if subject is None:
        raise credentials_exc

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise credentials_exc

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exc
    return user


def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Like :func:`get_current_user` but returns ``None`` instead of 401."""
    if not token:
        return None
    subject = decode_token(token)
    if subject is None:
        return None
    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        return None
    return db.get(User, user_id)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Report service status and whether the ML model is loaded."""
    return HealthResponse(
        status="ok" if ml_model.loaded else "degraded",
        model_loaded=ml_model.loaded,
        feature_names_count=len(ml_model.feature_names),
        version=settings.APP_VERSION,
    )


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post(
    "/api/v1/auth/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> Token:
    """Create a new user account and return a JWT."""
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.refresh(user)

    return Token(access_token=create_access_token(user.id))


@app.post("/api/v1/auth/login", response_model=Token, tags=["Auth"])
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    """Authenticate a user and return a JWT."""
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))


@app.get("/api/v1/auth/me", response_model=UserOut, tags=["Auth"])
def me(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile."""
    return current_user


# ---------------------------------------------------------------------------
# Assessment
# ---------------------------------------------------------------------------

@app.post(
    "/api/v1/assessment/predict",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    tags=["Assessment"],
)
def predict_assessment(
    payload: AssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> AssessmentResponse:
    """Predict malaria likelihood, classify urgency, and persist the assessment.

    If a valid Bearer token is supplied the record is linked to the user;
    otherwise it is stored as a guest assessment (nullable ``user_id``).
    """
    if not ml_model.loaded:
        raise HTTPException(status_code=503, detail="ML model is not loaded")

    payload_dict = payload.model_dump()
    result = triage_assessment(payload_dict)

    prediction_result = PredictionResult(**result)

    record = Assessment(
        user_id=current_user.id if current_user else None,
        symptoms_data=payload_dict,
        prediction_result=result,
        triage_level=result["urgency"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AssessmentResponse(
        id=record.id,
        prediction_result=prediction_result,
        triage_level=record.triage_level,
        symptoms_data=record.symptoms_data,
        created_at=record.created_at,
    )


@app.get(
    "/api/v1/assessment/history",
    response_model=list[AssessmentHistoryItem],
    tags=["Assessment"],
)
def assessment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AssessmentHistoryItem]:
    """Return all assessments belonging to the authenticated user."""
    rows = db.scalars(
        select(Assessment)
        .where(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
    ).all()
    return [AssessmentHistoryItem.model_validate(r) for r in rows]


# ---------------------------------------------------------------------------
# Convenience routes
# ---------------------------------------------------------------------------

@app.get("/api/v1", response_model=MessageResponse, tags=["System"])
def api_root() -> MessageResponse:
    return MessageResponse(message=f"{settings.APP_NAME} API v{settings.APP_VERSION}")


@app.get("/", response_model=MessageResponse, tags=["System"])
def root() -> MessageResponse:
    return MessageResponse(message=f"Welcome to {settings.APP_NAME} API. See /docs.")
