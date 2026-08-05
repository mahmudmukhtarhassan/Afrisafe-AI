from fastapi import APIRouter, HTTPException, status

from app.schemas.prediction import PredictionRequest
from app.services.ai_service import predict, is_model_ready, load_model

router = APIRouter(tags=["AI"])


@router.post("/predict")
async def prediction(data: PredictionRequest):
    if not is_model_ready():
        load_model()
    if not is_model_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not available. Please try again later.",
        )

    # ai_service.predict returns (prediction, probability, model_version)
    result, probability, model_version = predict(data)

    return {
        "prediction": result,
        "probability": round(
            probability * 100,
            2,
        ),
        "model_version": model_version,
    }
