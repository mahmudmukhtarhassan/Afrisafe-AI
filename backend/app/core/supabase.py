import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Zai fi kyau a sa ANON_KEY a farko don kariya ga RLS
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables."
            )
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    return _supabase
