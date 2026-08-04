-- Ensure EXECUTE is revoked from anon and authenticated on the trigger function.
-- The earlier migration did not take effect (advisor still flags it).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
