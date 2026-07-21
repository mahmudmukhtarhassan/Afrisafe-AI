from fastapi import APIRouter, HTTPException

from schemas.request import PredictionRequest
from schemas.response import PredictionResponse
from services.prediction_service import predict

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)


@router.post(
    "",
    response_model=PredictionResponse,
    summary="Predict malaria risk",
    description="Predict malaria risk from patient symptoms."
)
async def predict_malaria(data: PredictionRequest):
    """
    Predict malaria risk using the trained machine learning model.
    """
    try:
        return predict(data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

