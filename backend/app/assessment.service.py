from app.repositories.assessment_repository import AssessmentRepository


class AssessmentService:

    @staticmethod
    async def save(user_id: str, data):

        payload = {
            "user_id": user_id,
            "fever": data.fever,
            "headache": data.headache,
            "chills": data.chills,
            "vomiting": data.vomiting,
            "fatigue": data.fatigue,
            "body_pain": data.body_pain,
            "prediction": data.prediction,
            "probability": data.probability,
            "recommendation": data.recommendation,
            "urgency": data.urgency,
            "next_action": data.next_action,
        }

        return AssessmentRepository.create(payload).data

    @staticmethod
    async def history(user_id: str):
        return AssessmentRepository.list_by_user(user_id).data

    @staticmethod
    async def remove(user_id: str, assessment_id: str):
        return AssessmentRepository.delete(user_id, assessment_id).data

    @staticmethod
    async def dashboard(user_id: str):

        rows = AssessmentRepository.list_by_user(user_id).data

        total = len(rows)

        high = len([r for r in rows if r["prediction"] == "High Risk"])

        medium = len([r for r in rows if r["prediction"] == "Medium Risk"])

        low = len([r for r in rows if r["prediction"] == "Low Risk"])

        return {
            "total": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
        }
