import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/paystackProvider';
import {
  BILLING_PLANS, isPlanKey, isPeriod, isCurrency, renewalDays,
  type Currency,
} from '@/lib/billingConfig';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ① Read raw bytes FIRST — HMAC must be computed over the exact request bytes.
  //    Calling req.json() before this would consume the stream and make HMAC impossible.
  const rawBody  = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('x-paystack-signature');

  // ② Verify HMAC-SHA512 signature — reject anything that doesn't match.
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[ps-webhook] Invalid or missing x-paystack-signature — rejecting');
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { event: eventType, data } = event;
  console.log('[ps-webhook] event:', eventType, '| ref:', data?.reference ?? '—');

  // Only act on charge.success — return 200 for everything else so Paystack stops retrying.
  if (eventType !== 'charge.success') return NextResponse.json({ ok: true });

  const reference: string = data?.reference;
  if (!reference) {
    console.error('[ps-webhook] Missing data.reference in payload');
    return NextResponse.json({ ok: true });
  }

  // ③ Call Paystack's verify API — authoritative confirmation separate from the webhook payload.
  //    Never trust payload amounts; always use the verified response.
  let verified: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    verified = await verifyTransaction(reference);
  } catch (err) {
    console.error('[ps-webhook] verifyTransaction failed:', err);
    return NextResponse.json({ error: 'Could not verify transaction.' }, { status: 500 });
  }

  // ③ a — status must be 'success' per Paystack verify response.
  if (verified.status !== 'success') {
    console.warn('[ps-webhook] not success:', verified.status, '| ref:', reference);
    return NextResponse.json({ ok: true });
  }

  const meta     = verified.metadata;
  const plan     = meta.plan   as string;
  const period   = meta.period as string;

  // ③ b — currency from metadata (set at checkout from server-side BILLING_PLANS).
  const metaCurrency = meta.currency as string | undefined;
  const currency: Currency = isCurrency(metaCurrency)
    ? metaCurrency
    : (isCurrency(verified.currency) ? verified.currency as Currency : 'NGN');

  if (!isCurrency(verified.currency) || verified.currency !== currency) {
    console.warn('[ps-webhook] currency mismatch — meta:', currency, '| verified:', verified.currency, '| ref:', reference);
    return NextResponse.json({ ok: true });
  }

  // ③ c — plan + period must be valid keys before amount lookup.
  if (!isPlanKey(plan) || !isPeriod(period)) {
    console.error('[ps-webhook] invalid plan/period in metadata:', meta);
    return NextResponse.json({ ok: true });
  }

  // ③ d — verified amount (in subunits) must meet the server-side expected amount × 100.
  //    BILLING_PLANS stores whole units (e.g. 39000 NGN / 29 USD); Paystack returns kobo/cents.
  const expectedSubunits = BILLING_PLANS[plan][currency][period] * 100;
  if (verified.amount < expectedSubunits) {
    console.error('[ps-webhook] amount too low — expected:', expectedSubunits,
      '| got:', verified.amount, '| ref:', reference);
    return NextResponse.json({ ok: true });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Resolve user_id — primary: metadata.user_id set at checkout via getUser() (server-side).
  // Fallback: look up by customer email for renewal events where metadata may be absent.
  let userId: string = (meta.user_id as string | undefined) ?? '';
  if (!userId && verified.customer.email) {
    const { data: p } = await admin
      .from('profiles')
      .select('id')
      .eq('payment_customer_id', verified.customer.email)
      .maybeSingle();
    userId = p?.id ?? '';
  }

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    console.error('[ps-webhook] could not resolve user_id, ref:', reference);
    return NextResponse.json({ ok: true });
  }

  // ④ Idempotency — if this reference is already in transactions, skip all updates.
  //    The UNIQUE constraint on transactions.reference is the hard anchor;
  //    this SELECT is an early-exit optimisation before the INSERT attempt.
  const { data: existing } = await admin
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .maybeSingle();

  if (existing) {
    console.log('[ps-webhook] duplicate reference — skipping:', reference);
    return NextResponse.json({ ok: true });
  }

  // ⑤ Insert transaction first — this is the idempotency anchor.
  //    If a concurrent retry races past the SELECT above, the UNIQUE constraint
  //    will reject the second INSERT and we return 500 (Paystack won't retry a 200).
  const { error: txErr } = await admin.from('transactions').insert({
    user_id:   userId,
    reference,
    amount:    verified.amount / 100,   // store in whole units, consistent with BILLING_PLANS
    currency,
    plan,
    period,
    status:    'completed',
    provider:  'paystack',
  });

  if (txErr) {
    console.error('[ps-webhook] transaction insert failed:', txErr.message);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  // ⑥ Update profiles.plan — this is what every gating route reads.
  const now         = new Date();
  const nextRenewal = new Date(now.getTime() + renewalDays(period) * 86_400_000);

  const { error: profileErr } = await admin.from('profiles').update({
    plan,
    billing_period:      period,
    subscription_status: 'active',
    subscription_start:  now.toISOString(),
    next_renewal_at:     nextRenewal.toISOString(),
    payment_customer_id: verified.customer.email ?? null,
    minutes_used:        0,
  }).eq('id', userId);

  if (profileErr) {
    console.error('[ps-webhook] profile update failed:', profileErr.message);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  console.log('[ps-webhook] applied — user:', userId, 'plan:', plan, 'period:', period, 'currency:', currency);
  return NextResponse.json({ ok: true });
}
