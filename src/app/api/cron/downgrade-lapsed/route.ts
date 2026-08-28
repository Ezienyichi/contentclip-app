import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Called by Vercel Cron daily. Finds profiles where subscription was cancelled
// and next_renewal_at has passed — downgrades them to 'free'.
// Also catches any accidental active subscriptions past renewal (belt-and-suspenders).
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date().toISOString();

  // Downgrade cancelled subscriptions whose access period has expired.
  const { data: lapsed, error } = await admin
    .from('profiles')
    .update({
      plan:                'free',
      subscription_status: 'none',
      billing_period:      null,
    })
    .eq('subscription_status', 'cancelled')
    .lt('next_renewal_at', now)
    .select('id, plan');

  if (error) {
    console.error('[cron/downgrade-lapsed] DB error:', error.message);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  const count = lapsed?.length ?? 0;
  console.log(`[cron/downgrade-lapsed] downgraded ${count} lapsed subscription(s)`);
  return NextResponse.json({ downgraded: count });
}
