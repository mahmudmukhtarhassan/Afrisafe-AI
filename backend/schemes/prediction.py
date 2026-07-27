from pydantic import BaseModel


class PredictionRequest(BaseModel):
    fever: int
    headache: int
    chills: int
    vomiting: int
    fatigue: int
    body_pain: int


class PredictionResponse(BaseModel):
    prediction: str
    probability: float
