from app.repositories.assessment_repository import AssessmentRepository


class AssessmentService:
    def __init__(self):
        self.repository = AssessmentRepository()

    def process_triage(self, payload: dict):
        # Process triage business logic/ML predictions here
        result = {
            "assessment_id": payload.get("assessment_id"),
            "risk_level": "High",
            "condition": "Malaria Risk Detected",
            "confidence": 88,
        }
        
        # Save to database
        self.repository.create_assessment(result)
        return result
