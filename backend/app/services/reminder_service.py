from app.core.supabase import get_supabase

supabase = get_supabase()
class ReminderService:

    @staticmethod
    async def create(user_id: str, data):
        return (
            supabase
            .table("reminders")
            .insert({
                "user_id": user_id,
                "title": data.title,
                "reminder_date": data.reminder_date.isoformat()
            })
            .execute()
            .data
        )

    @staticmethod
    async def list(user_id: str):
        return (
            supabase
            .table("reminders")
            .select("*")
            .eq("user_id", user_id)
            .order("reminder_date")
            .execute()
            .data
        )
