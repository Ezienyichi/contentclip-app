-- ============================================================================
-- Stop users from editing their own billing / quota columns.
--
-- Before this, "Users can update own profile" (FOR UPDATE USING auth.uid() = id)
-- allowed any signed-in user to run, from the browser console:
--
--   supabase.from('profiles').update({ plan: 'agency', minutes_used: 0 })
--           .eq('id', <their own id>)
--
-- granting themselves a paid plan and an unlimited quota. RLS policies cannot
-- restrict WHICH columns an UPDATE touches, so the row-level policy alone can
-- never fix this. Two mechanisms are needed, and this migration applies both:
--
--   1. Column-level privileges (GRANT UPDATE (col, ...)) — the real enforcement.
--      Fail-closed: a column added later is NOT user-updatable until someone
--      deliberately adds it to the grant list below.
--   2. A BEFORE UPDATE trigger — defense in depth. Survives a future
--      `GRANT UPDATE ON profiles TO authenticated` that would silently undo (1),
--      and returns a readable error instead of a bare permission denial.
--
-- Writes from the service role (webhooks, cron, server routes using
-- SUPABASE_SERVICE_ROLE_KEY) are unaffected — see the bypass in the function.
--
-- Safe to re-run.
-- ============================================================================

-- ── 1. Row-level policy: unchanged in effect, restated explicitly ───────────
-- Omitting WITH CHECK on an UPDATE policy makes Postgres reuse USING for the
-- new row, so this was never the hole — but being explicit documents intent.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 2. Column privileges — the actual fix ──────────────────────────────────
-- Blanket UPDATE is what made every column writable. Replace it with an
-- allow-list of columns a user may legitimately edit about themselves.
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

GRANT UPDATE (
  full_name,
  avatar_url,
  clip_ready_notify,
  weekly_digest,
  updated_at
) ON public.profiles TO authenticated;

-- NOTE: acquisition_source / content_category / main_goal are deliberately NOT
-- granted. They are written only by /api/user/onboarding, which uses the
-- service role. Add a column here only after confirming a user editing it
-- freely cannot affect billing, quota, or identity.

-- ── 3. Trigger guard — defense in depth ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  -- Money, quota, and identity. Anything here must only ever be set by
  -- server-side code holding the service-role key.
  protected_cols constant text[] := ARRAY[
    'id',
    'email',
    'plan',
    'minutes_used',
    'minutes_reset_at',
    'credits',
    'credits_remaining',
    'credits_total',
    'topup_minutes_balance',
    'downloads_used',
    'subscription_status',
    'subscription_start',
    'billing_period',
    'next_renewal_at',
    'payment_customer_id',
    'payment_subscription_id',
    'stripe_customer_id',
    'stripe_subscription_id',
    'created_at'
  ];
  col    text;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
BEGIN
  -- Server-side callers pass through untouched. PostgREST does SET ROLE to the
  -- JWT's role, so current_user is 'service_role' for service-key requests and
  -- 'authenticated' for user requests. 'postgres'/'supabase_admin' cover the
  -- SQL editor, migrations, and dashboard edits.
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY protected_cols LOOP
    -- `old_row ? col` skips names not present on this table, so the list above
    -- stays valid as columns are added or dropped.
    IF (old_row ? col)
       AND (old_row -> col) IS DISTINCT FROM (new_row -> col) THEN
      RAISE EXCEPTION
        'profiles.% is a billing/quota column and cannot be changed by the account holder', col
        USING ERRCODE = '42501';  -- insufficient_privilege
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Fires before update_profiles_updated_at ('g' sorts before 'u'), so the guard
-- sees the client's values, not the ones that trigger rewrites.
DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- ============================================================================
-- Verify (run as a normal signed-in user, e.g. from the browser console):
--
--   await supabase.from('profiles').update({ plan: 'agency' }).eq('id', uid)
--     -> permission denied for table profiles            (column privilege)
--
--   await supabase.from('profiles').update({ minutes_used: 0 }).eq('id', uid)
--     -> permission denied for table profiles
--
--   await supabase.from('profiles').update({ full_name: 'X' }).eq('id', uid)
--     -> succeeds
--
-- To confirm the trigger independently, re-grant blanket UPDATE in a
-- transaction and retry — the RAISE EXCEPTION message should appear — then
-- ROLLBACK.
-- ============================================================================
