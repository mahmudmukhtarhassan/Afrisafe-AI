from fastapi import APIRouter, HTTPException, status

from app.schemas.prediction import PredictionRequest
from app.services.ai_service import predict, is_model_ready, load_model, get_model_version

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


@router.get("/version")
def version():
    """Return model availability and version.

    This endpoint attempts to load the model if it isn't already loaded so it can report
    a more accurate readiness state in fresh deployments.
    """
    if not is_model_ready():
        try:
            load_model()
        except Exception:
            pass

    return {"model_ready": is_model_ready(), "model_version": get_model_version()}
