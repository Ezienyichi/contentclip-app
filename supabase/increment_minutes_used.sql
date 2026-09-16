-- Atomic increment for profiles.minutes_used.
--
-- /api/clip-status previously did read-modify-write:
--   SELECT minutes_used -> compute newTotal -> UPDATE minutes_used = newTotal
-- Two jobs finishing at the same moment both read the same starting value and
-- the second write silently discards the first job's minutes.
--
-- Executable by service_role only. service_role is exempt from the
-- guard_profile_privileged_columns trigger (see
-- lock_profile_privileged_columns.sql), so SECURITY INVOKER is enough here —
-- deliberately NOT SECURITY DEFINER, which would create an escalation surface
-- for a column users are otherwise blocked from writing.
--
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.increment_minutes_used(
  p_user_id uuid,
  p_minutes integer
)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  UPDATE public.profiles
     SET minutes_used = COALESCE(minutes_used, 0) + p_minutes
   WHERE id = p_user_id
  RETURNING minutes_used;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_minutes_used(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_minutes_used(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_minutes_used(uuid, integer) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_minutes_used(uuid, integer) TO service_role;
