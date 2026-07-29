from app.core.supabase import supabase

class AssessmentRepository:

    @staticmethod
    def create(data: dict):
        return (
            supabase
            .table("assessments")
            .insert(data)
            .execute()
        )

    @staticmethod
    def list_by_user(user_id: str):
        return (
            supabase
            .table("assessments")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

    @staticmethod
    def delete(user_id: str, assessment_id: str):
        return (
            supabase
            .table("assessments")
            .delete()
            .eq("id", assessment_id)
            .eq("user_id", user_id)
            .execute()
        )
