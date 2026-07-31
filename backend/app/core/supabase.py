import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_supabase: Client | None = None

def get_supabase() -> Client:
global _supabase
if _supabase is None:
_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
return _supabase

