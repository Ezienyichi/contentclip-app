import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Cancelling used to run in the browser as:
//   profiles.update({ plan: 'free', credits: 30, minutes_used: 0 })
// which (a) is now blocked — those are protected columns, see
// supabase/lock_profile_privileged_columns.sql — and (b) was wrong anyway:
// it revoked paid access on the spot even though the cancel dialog promises
// "your plan stays active until your current billing period ends", and it
// never set subscription_status, so /api/cron/downgrade-lapsed could not
// pick the account up later.
//
// Correct model (matches the cron and the lapse check in /api/upload/presign):
// mark the subscription cancelled, keep plan + next_renewal_at intact, and let
// the daily cron downgrade to free once the paid period actually expires.
export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Scoped to this user's own row, and only from 'active' — so a repeated
  // click can't churn the record or resurrect a finished subscription.
  const { data: updated, error } = await admin
    .from('profiles')
    .update({ subscription_status: 'cancelled' })
    .eq('id', user.id)
    .eq('subscription_status', 'active')
    .select('plan, next_renewal_at')
    .maybeSingle();

  if (error) {
    console.error('[billing/cancel] DB error', error.message);
    return NextResponse.json({ error: 'Could not cancel your plan.' }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json(
      { error: 'No active subscription to cancel.' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok:              true,
    plan:            updated.plan,
    access_until:    updated.next_renewal_at,
  });
}
