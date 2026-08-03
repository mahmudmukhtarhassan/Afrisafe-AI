"""
Reports router for AfriSafe AI (Render backend).
Generates PDF reports from prediction history stored in Supabase.
"""
import os
import requests
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import Response
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from dotenv import load_dotenv
import io

load_dotenv()

router = APIRouter(tags=["Reports"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REST_URL = f"{SUPABASE_URL}/rest/v1"

service_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


def get_user_id_from_request(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return resp.json().get("id")


def _generate_pdf(assessment: dict) -> bytes:
    buffer = io.BytesIO()
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(buffer, pagesize=letter)

    story = [
        Paragraph("<b>AfriSafe AI - Malaria Assessment Report</b>", styles["Title"]),
        Spacer(1, 0.2 * inch),
        Paragraph(f"Prediction: {assessment.get('prediction', 'N/A')}", styles["Normal"]),
        Paragraph(f"Confidence: {assessment.get('confidence', 0)}%", styles["Normal"]),
        Paragraph(f"Risk Level: {assessment.get('risk', 'N/A')}", styles["Normal"]),
        Spacer(1, 0.15 * inch),
        Paragraph(f"Recommendation: {assessment.get('recommendation', 'N/A')}", styles["Normal"]),
        Spacer(1, 0.15 * inch),
        Paragraph("AI Insights:", styles["Heading2"]),
        Paragraph(assessment.get("ai_insights", "N/A"), styles["Normal"]),
        Spacer(1, 0.15 * inch),
        Paragraph("Medical Disclaimer: This AI assessment is for screening purposes only "
                  "and does not replace professional medical advice.", styles["Normal"]),
    ]

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


@router.get("/{prediction_id}/pdf")
def pdf_report(prediction_id: str, request: Request):
    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/predictions?id=eq.{prediction_id}&user_id=eq.{user_id}"
    resp = requests.get(url, headers=service_headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=resp.text)

    rows = resp.json()
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    assessment = rows[0]
    pdf_bytes = _generate_pdf(assessment)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=afrisafe-report.pdf"},
    )
