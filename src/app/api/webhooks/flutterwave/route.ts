import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookHash, verifyTransaction } from '@/lib/flutterwaveProvider';
import {
  BILLING_PLANS, isPlanKey, isPeriod, isCurrency, renewalDays,
  type Currency,
} from '@/lib/billingConfig';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ① Verify verif-hash header matches FLUTTERWAVE_WEBHOOK_SECRET_HASH.
  //    Flutterwave's mechanism is string equality — the secret is set once in
  //    the FW dashboard and compared here. Reject anything that doesn't match.
  if (!verifyWebhookHash(req.headers.get('verif-hash'))) {
    console.warn('[fw-webhook] Invalid or missing verif-hash — rejecting');
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { event, data } = body;
  console.log('[fw-webhook] event:', event, '| id:', data?.id, '| tx_ref:', data?.tx_ref ?? '—');

  // Only process charge.completed — return 200 for everything else so FW stops retrying.
  if (event !== 'charge.completed') return NextResponse.json({ ok: true });

  const transactionId: number = data?.id;
  if (!transactionId) {
    console.error('[fw-webhook] Missing data.id in payload');
    return NextResponse.json({ ok: true });
  }

  // ② Call Flutterwave's verify API — authoritative confirmation separate from webhook payload.
  let verified: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    verified = await verifyTransaction(transactionId);
  } catch (err) {
    console.error('[fw-webhook] verifyTransaction failed:', err);
    return NextResponse.json({ error: 'Could not verify transaction.' }, { status: 500 });
  }

  const meta   = (verified.meta ?? data?.meta ?? {}) as Record<string, unknown>;
  const plan   = meta.plan   as string;
  const period = meta.period as string;

  // ② a — status must be 'successful' per FW verify response
  if (verified.status !== 'successful') {
    console.warn('[fw-webhook] not successful:', verified.status, '| tx_ref:', verified.tx_ref);
    return NextResponse.json({ ok: true });
  }

  // ② b — currency must be USD or NGN; must match what was declared at checkout in meta
  const metaCurrency = meta.currency as string | undefined;
  const currency: Currency = isCurrency(metaCurrency) ? metaCurrency : (isCurrency(verified.currency) ? verified.currency as Currency : 'USD');

  if (!isCurrency(verified.currency) || verified.currency !== currency) {
    console.warn('[fw-webhook] currency mismatch — meta:', currency, '| verified:', verified.currency, '| tx_ref:', verified.tx_ref);
    return NextResponse.json({ ok: true });
  }

  // ② c — plan + period must be valid before amount lookup
  if (!isPlanKey(plan) || !isPeriod(period)) {
    console.error('[fw-webhook] invalid plan/period in meta:', meta);
    return NextResponse.json({ ok: true });
  }

  // ② d — verified amount must meet or exceed server-side expected amount for this currency.
  //    Uses the server-side BILLING_PLANS config — never the webhook payload amount.
  const expectedAmount = BILLING_PLANS[plan][currency][period];
  if (verified.amount < expectedAmount) {
    console.error('[fw-webhook] amount too low — expected:', expectedAmount, currency,
      '| got:', verified.amount, '| tx_ref:', verified.tx_ref);
    return NextResponse.json({ ok: true });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Resolve user_id — primary: meta.user_id set at checkout from getUser().
  // Fallback: look up by email for renewal webhooks where meta may not carry user_id.
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
    console.error('[fw-webhook] could not resolve user_id, tx_ref:', verified.tx_ref);
    return NextResponse.json({ ok: true });
  }

  // ⑤ Idempotency — if this tx_ref is already in transactions, skip all updates.
  const { data: existing } = await admin
    .from('transactions')
    .select('id')
    .eq('reference', verified.tx_ref)
    .maybeSingle();

  if (existing) {
    console.log('[fw-webhook] duplicate tx_ref — skipping:', verified.tx_ref);
    return NextResponse.json({ ok: true });
  }

  // Insert transaction first — this is the idempotency anchor.
  const { error: txErr } = await admin.from('transactions').insert({
    user_id:   userId,
    reference: verified.tx_ref,
    amount:    verified.amount,
    currency,
    plan,
    period,
    status:    'completed',
    provider:  'flutterwave',
  });

  if (txErr) {
    console.error('[fw-webhook] transaction insert failed:', txErr.message);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  // ③ Update profiles.plan — this is what every gating route reads.
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
    console.error('[fw-webhook] profile update failed:', profileErr.message);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  console.log('[fw-webhook] applied — user:', userId, 'plan:', plan, 'period:', period, 'currency:', currency);
  return NextResponse.json({ ok: true });
}
