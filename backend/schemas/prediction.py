from pydantic import BaseModel, Field
from typing import Optional, List

class SymptomAssessmentRequest(BaseModel):
    fever: int = Field(..., ge=0, le=1, description="1 if present, 0 if absent")
    headache: int = Field(..., ge=0, le=1, description="1 if present, 0 if absent")
    chills: int = Field(..., ge=0, le=1, description="1 if present, 0 if absent")
    fatigue: int = Field(..., ge=0, le=1, description="1 if present, 0 if absent")
    nausea: int = Field(..., ge=0, le=1, description="1 if present, 0 if absent")
    joint_pain: int = Field(..., ge=0, le=1, description="1 if present, 0 if absent")
    age: int = Field(..., ge=0, le=120, description="Patient age in years")
    duration_days: int = Field(..., ge=1, le=30, description="Duration of symptoms in days")

    class Config:
        json_schema_extra = {
            "example": {
                "fever": 1,
                "headache": 1,
                "chills": 0,
                "fatigue": 1,
                "nausea": 0,
                "joint_pain": 1,
                "age": 25,
                "duration_days": 3
            }
        }

class PredictionResult(BaseModel):
    has_malaria: bool
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # "Low", "Moderate", "High"
    recommendations: List[str]
