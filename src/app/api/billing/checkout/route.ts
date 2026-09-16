import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import {
  BILLING_PLANS, isPlanKey, isPeriod, isCurrency,
  type PlanKey, type Period, type Currency,
} from '@/lib/billingConfig';
import { initializeTransaction } from '@/lib/paystackProvider';

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

  let plan: PlanKey, period: Period, currency: Currency;
  try {
    const body = await req.json();
    plan     = body.plan;
    period   = body.period;
    currency = body.currency ?? 'NGN';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  console.log('[checkout] (b) plan:', plan, '| period:', period, '| currency:', currency);
  if (!isPlanKey(plan))      return NextResponse.json({ error: 'Invalid plan.'     }, { status: 400 });
  if (!isPeriod(period))     return NextResponse.json({ error: 'Invalid period.'   }, { status: 400 });
  if (!isCurrency(currency)) return NextResponse.json({ error: 'Invalid currency.' }, { status: 400 });

  // Amount from server-side config — never from the client.
  const amount      = BILLING_PLANS[plan][currency][period];
  const amountKobo  = amount * 100;   // Paystack expects subunits (kobo for NGN, cents for USD)
  const reference   = randomUUID();
  const origin      = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  const callbackUrl = `${origin}/billing/success?plan=${plan}&period=${period}`;

  console.log('[checkout] amount:', amount, currency, '| amountKobo:', amountKobo, '| callbackUrl:', callbackUrl);
  console.log('[checkout] Paystack key set:', !!process.env.PAYSTACK_SECRET_KEY);

  let payment_link: string;
  try {
    console.log('[checkout] (c) calling initializeTransaction…');
    const result = await initializeTransaction({
      email:       user.email,
      amountKobo,
      currency,
      reference,
      callbackUrl,
      metadata: {
        user_id:  user.id,
        plan,
        period,
        currency,
      },
    });
    payment_link = result.payment_link;
    console.log('[checkout] (d) Paystack init SUCCESS — payment_link:', payment_link);
  } catch (err) {
    console.error('[checkout] (d) Paystack init FAILED:', String(err));
    return NextResponse.json({ error: `Payment provider error: ${String(err)}` }, { status: 502 });
  }

  return NextResponse.json({ payment_link });
}
