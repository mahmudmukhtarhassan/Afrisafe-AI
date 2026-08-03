-- Revoke EXECUTE on the handle_new_user() trigger function from anon and authenticated roles.
-- The function is a trigger (called by the DB on INSERT to auth.users), not meant to be called via REST API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
