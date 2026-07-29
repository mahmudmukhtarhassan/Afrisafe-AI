from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph
from pathlib import Path

REPORT_DIR = Path("reports")
REPORT_DIR.mkdir(exist_ok=True)

class ReportService:

    @staticmethod
    def generate_pdf(assessment: dict):

        file_path = REPORT_DIR / f"{assessment['id']}.pdf"

        styles = getSampleStyleSheet()

        doc = SimpleDocTemplate(str(file_path))

        story = [
            Paragraph("<b>AfriSafe AI - Malaria Assessment Report</b>", styles["Title"]),
            Paragraph(f"Prediction: {assessment['prediction']}", styles["Normal"]),
            Paragraph(f"Probability: {assessment['probability']}%", styles["Normal"]),
            Paragraph(f"Recommendation: {assessment.get('recommendation', '')}", styles["Normal"]),
            Paragraph(f"Urgency: {assessment.get('urgency', '')}", styles["Normal"]),
            Paragraph(f"Next Action: {assessment.get('next_action', '')}", styles["Normal"]),
        ]

        doc.build(story)

        return file_path
