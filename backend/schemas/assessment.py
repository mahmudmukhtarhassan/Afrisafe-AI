from pydantic import BaseModel


class AssessmentCreate(BaseModel):
    fever: bool
    headache: bool
    chills: bool
    vomiting: bool
    fatigue: bool
    body_pain: bool
    prediction: str
    probability: float
    recommendation: str
    urgency: str
    next_action: str


class AssessmentResponse(BaseModel):
    id: str
    prediction: str
    probability: float
    created_at: str
