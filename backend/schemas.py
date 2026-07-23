"""Pydantic v2 request/response schemas for the AfriSafe AI API."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None


# ---------------------------------------------------------------------------
# Assessment / Prediction
# ---------------------------------------------------------------------------

class AssessmentRequest(BaseModel):
    """Payload accepted by the prediction endpoint.

    Mirrors the frontend form. ``symptoms`` is a free-form list of symptom
    labels (e.g. "Fever", "High Fever", "Headache", "Chills", "Vomiting",
    "Body Pain", "Loss of Appetite", "Sweating", "Fatigue") that the ML
    service maps onto the model's binary feature columns.
    """

    age: int = Field(ge=0, le=120)
    gender: Literal["Male", "Female", "Other"]
    state: str
    lga: str | None = None
    symptoms: list[str] = Field(default_factory=list)
    duration: int = Field(ge=1, le=14, default=1)
    mosquitoBites: bool = False
    travelled: bool = False
    malariaDrugs: bool = False


class PredictionResult(BaseModel):
    prediction: str
    probability: float = Field(ge=0.0, le=1.0)
    risk: str
    urgency: str
    confidence: float = Field(ge=0.0, le=100.0)
    recommendation: str
    advice: list[str]
    aiInsights: str


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    prediction_result: PredictionResult
    triage_level: str
    symptoms_data: dict
    created_at: datetime | None = None


class AssessmentHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    triage_level: str
    symptoms_data: dict
    prediction_result: dict
    created_at: datetime


# ---------------------------------------------------------------------------
# Generic responses
# ---------------------------------------------------------------------------

class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    feature_names_count: int
    version: str
