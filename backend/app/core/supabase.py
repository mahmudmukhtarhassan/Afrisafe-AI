import os
from supabase import create_client, Client

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Returns a singleton Supabase client instance."""
    global _supabase_client
    if _supabase_client is None:
        url: str = os.getenv("SUPABASE_URL", "")
        key: str = os.getenv("SUPABASE_KEY", "")

        if not url or not key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY environment variables must be set."
            )

        _supabase_client = create_client(url, key)

    return _supabase_client


# Convenience direct export if imported as `from app.core.supabase import supabase`
try:
    supabase: Client = get_supabase()
except ValueError:
    supabase = None  # Prevents crash on import if env vars aren't set yet during build
