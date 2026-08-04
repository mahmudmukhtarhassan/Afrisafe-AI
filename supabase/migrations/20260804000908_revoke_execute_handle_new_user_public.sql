-- Revoke EXECUTE from all roles including PUBLIC so the trigger function
-- cannot be invoked via the REST API (only the DB trigger can call it).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
