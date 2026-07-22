from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import SymptomAssessmentRequest, PredictionResult
from app.schemas.response import APIEnvelope
from app.services.prediction_service import PredictionService

router = APIRouter()

@router.post(
    "/assess", 
    response_model=APIEnvelope[PredictionResult],
    status_code=status.HTTP_200_OK
)
async def assess_malaria_risk(payload: SymptomAssessmentRequest):
    try:
        result = PredictionService.predict_malaria(payload)
        return APIEnvelope(
            success=True,
            message="Risk assessment completed successfully",
            data=result
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )
