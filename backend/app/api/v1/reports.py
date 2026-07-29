from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import pandas as pd

from app.dependencies.auth import get_current_user
from app.services.assessment_service import AssessmentService
from app.services.report_service import ReportService

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"],
)

@router.get("/{assessment_id}/pdf")
async def pdf_report(
    assessment_id: str,
    user=Depends(get_current_user),
):

    history = await AssessmentService.history(
        user["sub"]
    )

    assessment = next(
        (a for a in history if a["id"] == assessment_id),
        None,
    )

    if not assessment:
        raise HTTPException(404, "Assessment not found")

    pdf_path = ReportService.generate_pdf(assessment)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="afrisafe-report.pdf",
    )

@router.get("/export/csv")
async def export_csv(
    user=Depends(get_current_user),
):

    history = await AssessmentService.history(
        user["sub"]
    )

    df = pd.DataFrame(history)

    path = "reports/assessment_history.csv"

    df.to_csv(path, index=False)

    return FileResponse(
        path,
        media_type="text/csv",
        filename="assessment_history.csv",
    )
