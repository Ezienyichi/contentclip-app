import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import {
  BILLING_PLANS, isPlanKey, isPeriod,
  type PlanKey, type Period,
} from '@/lib/billingConfig';
import { initializePayment, ensurePaymentPlan } from '@/lib/flutterwaveProvider';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
  console.log('[checkout] (a) getUser → id:', user?.id ?? null, '| authError:', authError?.message ?? null);
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!user.email)        return NextResponse.json({ error: 'Account has no email.' }, { status: 400 });

  let plan: PlanKey, period: Period;
  try {
    const body = await req.json();
    plan   = body.plan;
    period = body.period;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  console.log('[checkout] (b) plan:', plan, '| period:', period);
  if (!isPlanKey(plan))  return NextResponse.json({ error: 'Invalid plan.'   }, { status: 400 });
  if (!isPeriod(period)) return NextResponse.json({ error: 'Invalid period.' }, { status: 400 });

  const amountUSD = BILLING_PLANS[plan][period];
  const txRef     = randomUUID();
  const origin    = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  const redirectUrl = `${origin}/billing/success?plan=${plan}&period=${period}`;

  console.log('[checkout] amountUSD:', amountUSD, '| redirectUrl:', redirectUrl);
  console.log('[checkout] FW key set:', !!process.env.FLUTTERWAVE_SECRET_KEY);

  // Attach a Flutterwave payment plan for auto-renewal. Non-fatal if it fails.
  let paymentPlanId: number | undefined;
  try {
    const interval = period === 'annual' ? 'yearly' : 'monthly';
    const planName = `VangelClip ${plan[0].toUpperCase() + plan.slice(1)} (${interval})`;
    paymentPlanId = await ensurePaymentPlan({ name: planName, amountUSD, interval });
    console.log('[checkout] payment plan id:', paymentPlanId);
  } catch (err) {
    console.warn('[checkout] Could not attach FW payment plan (non-fatal):', String(err));
  }

  let payment_link: string;
  try {
    console.log('[checkout] (c) calling initializePayment…');
    const result = await initializePayment({
      email:   user.email,
      name:    (user.user_metadata?.full_name as string | undefined) ?? user.email,
      amountUSD,
      txRef,
      redirectUrl,
      paymentPlanId,
      meta: {
        user_id: user.id,
        plan,
        period,
      },
    });
    payment_link = result.payment_link;
    console.log('[checkout] (d) FW init SUCCESS — payment_link:', payment_link);
  } catch (err) {
    console.error('[checkout] (d) FW init FAILED:', String(err));
    return NextResponse.json({ error: `Payment provider error: ${String(err)}` }, { status: 502 });
  }

  return NextResponse.json({ payment_link });
}
