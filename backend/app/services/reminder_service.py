from app.core.supabase import get_supabase

class ReminderService:
    def __init__(self):
        # A nan za ka kira shi, ba a lokacin import ba
        self.supabase = get_supabase()

    # Ko kuma idan static methods kake amfani da su:
    @staticmethod
    def get_all_reminders():
        client = get_supabase()
        # sauran logic din...
