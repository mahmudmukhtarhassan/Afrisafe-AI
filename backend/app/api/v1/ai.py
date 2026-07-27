from fastapi import APIRouter

from app.schemas.prediction import (
    PredictionRequest,
)

from app.services.ai_service import predict

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI"],
)


@router.post("/predict")
async def prediction(data: PredictionRequest):

    result, probability = predict(data)

    return {
        "prediction": result,
        "probability": round(
            probability * 100,
            2,
        )
    }
