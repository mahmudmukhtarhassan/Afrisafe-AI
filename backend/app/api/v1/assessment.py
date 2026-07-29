from fastapi import APIRouter, Depends

from app.schemas.assessment import AssessmentCreate

from app.services.assessment_service import AssessmentService

from app.dependencies.auth import get_current_user

from app.utils.responses import success

router = APIRouter(
    prefix="/api/v1/assessment",
    tags=["Assessment"],
)


@router.post("")
async def create_assessment(
    data: AssessmentCreate,
    user=Depends(get_current_user),
):

    result = await AssessmentService.save(
        user["sub"],
        data,
    )

    return success(
        result,
        "Assessment saved successfully",
    )


@router.get("/history")
async def history(
    user=Depends(get_current_user),
):

    result = await AssessmentService.history(
        user["sub"]
    )

    return success(result)


@router.get("/dashboard")
async def dashboard(
    user=Depends(get_current_user),
):

    result = await AssessmentService.dashboard(
        user["sub"]
    )

    return success(result)


@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: str,
    user=Depends(get_current_user),
):

    result = await AssessmentService.remove(
        user["sub"],
        assessment_id,
    )

    return success(
        result,
        "Assessment deleted successfully",
    )
