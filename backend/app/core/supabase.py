import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_supabase: Client | None = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set.")
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase

# Wannan zai hana ImportError idan wani fayil yana neman 'supabase' kai tsaye
try:
    supabase: Client = get_supabase()
except Exception:
    supabase = None  # Fallback idan env vars ba su zauna ba a build time
