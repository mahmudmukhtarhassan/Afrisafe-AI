from fastapi import APIRouter, HTTPException, status
from app.services.assessment_service import AssessmentService

router = APIRouter()
service = AssessmentService()


@router.post("/predict", status_code=status.HTTP_200_OK)
def calculate_assessment(payload: dict):
    try:
        result = service.process_triage(payload)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process assessment: {str(e)}"
        )
