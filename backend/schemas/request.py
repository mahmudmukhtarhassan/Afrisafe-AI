from typing import Literal
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """
    Request schema for malaria symptom prediction.
    """

    age: int = Field(
        ...,
        ge=0,
        le=120,
        description="Patient age"
    )

    gender: Literal["Male", "Female"]

    state: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Nigerian state"
    )

    fever: int = Field(..., ge=0, le=1)
    high_fever: int = Field(..., ge=0, le=1)
    headache: int = Field(..., ge=0, le=1)
    chills: int = Field(..., ge=0, le=1)
    vomiting: int = Field(..., ge=0, le=1)

    duration: int = Field(
        ...,
        ge=0,
        le=30,
        description="Number of days symptoms have lasted"
    )
