import os
from functools import lru_cache
from supabase import create_client, Client


@lru_cache()
def get_supabase() -> Client:
    """Return a Supabase Client that enforces Row Level Security (use ANON key).

    This function is cached with functools.lru_cache so it can be used as a
    FastAPI dependency (pass the function itself to Depends). It intentionally
    requires SUPABASE_ANON_KEY and will NOT fall back to the service role key to
    avoid bypassing RLS.
    """
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not anon_key:
        raise RuntimeError(
            "Missing Supabase credentials for standard client. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment."
        )

    return create_client(url, anon_key)


@lru_cache()
def get_supabase_admin() -> Client:
    """Return a Supabase Client using the Service Role key for admin tasks.

    This client bypasses RLS and must only be used for privileged operations.
    Ensure SUPABASE_SERVICE_ROLE_KEY is kept secret and not used for normal
    request handling.
    """
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not service_key:
        raise RuntimeError(
            "Missing Supabase credentials for admin client. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
        )

    return create_client(url, service_key)


# Backwards compatibility: some modules import `supabase` directly.
# Provide a module-level client using the ANON key so existing imports do not break.
# Prefer using get_supabase()/get_supabase_admin() in new code.
try:
    supabase: Client = get_supabase()
except Exception:
    # Defer raising until the caller actually needs the client; keep attribute present
    supabase = None  # type: ignore

try:
    supabase_admin: Client = get_supabase_admin()
except Exception:
    supabase_admin = None  # type: ignore
