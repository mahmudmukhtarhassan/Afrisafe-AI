from app.core.supabase import get_supabase


class AssessmentRepository:
    def __init__(self):
        self.client = get_supabase()

    def create_assessment(self, data: dict):
        response = self.client.table("assessments").insert(data).execute()
        return response.data

    def get_assessment_by_id(self, assessment_id: str):
        response = (
            self.client.table("assessments")
            .select("*")
            .eq("id", assessment_id)
            .single()
            .execute()
        )
        return response.data
