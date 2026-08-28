import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/paystackProvider';
import { isPlanKey, isPeriod, renewalDays } from '@/lib/billingConfig';

export const dynamic = 'force-dynamic';

// Must read raw bytes for HMAC verification — do not use req.json() before this.
export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[paystack-webhook] Invalid or missing signature — rejecting');
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { event: eventType, data } = event;
  console.log('[paystack-webhook] event:', eventType, '| ref:', data?.reference ?? data?.subscription_code ?? '—');

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── charge.success ────────────────────────────────────────────────────────
  // Fires on first payment (one-time or first subscription charge).
  if (eventType === 'charge.success') {
    const reference: string = data.reference;
    const meta = data.metadata ?? {};
    const userId: string = meta.user_id ?? '';
    const plan  = meta.plan;
    const period = meta.period;

    if (!userId || !isPlanKey(plan) || !isPeriod(period)) {
      console.error('[paystack-webhook] charge.success missing/invalid metadata', meta);
      return NextResponse.json({ ok: true }); // 200 so Paystack doesn't retry
    }

    // Idempotency: if this reference is already recorded, skip.
    const { data: existing } = await admin
      .from('transactions')
      .select('id')
      .eq('reference', reference)
      .maybeSingle();

    if (existing) {
      console.log('[paystack-webhook] duplicate reference — skipping:', reference);
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const nextRenewal = new Date(now.getTime() + renewalDays(period) * 86_400_000);

    // Insert transaction record first (idempotency anchor).
    const { error: txErr } = await admin.from('transactions').insert({
      user_id:   userId,
      reference,
      amount:    data.amount,
      plan,
      period,
      status:    'completed',
      provider:  'paystack',
    });
    if (txErr) {
      console.error('[paystack-webhook] transaction insert failed:', txErr.message);
      return NextResponse.json({ error: 'DB error.' }, { status: 500 });
    }

    // Update profiles.plan — this is what every gate reads.
    const { error: profileErr } = await admin.from('profiles').update({
      plan,
      billing_period:             period,
      subscription_status:        'active',
      subscription_start:         now.toISOString(),
      next_renewal_at:            nextRenewal.toISOString(),
      paystack_customer_code:     data.customer?.customer_code ?? null,
      minutes_used:               0,   // reset quota on plan change
    }).eq('id', userId);

    if (profileErr) {
      console.error('[paystack-webhook] profile update failed:', profileErr.message);
      return NextResponse.json({ error: 'DB error.' }, { status: 500 });
    }

    console.log('[paystack-webhook] charge.success applied — user:', userId, 'plan:', plan, 'period:', period);
  }

  // ── subscription.create ───────────────────────────────────────────────────
  // Fires when Paystack creates a subscription. Store subscription_code for
  // future cancel/disable events (which carry subscription_code, not user_id).
  else if (eventType === 'subscription.create') {
    const subscriptionCode: string = data.subscription_code;
    const customerCode: string     = data.customer?.customer_code ?? '';
    if (!subscriptionCode || !customerCode) return NextResponse.json({ ok: true });

    await admin.from('profiles')
      .update({ paystack_subscription_code: subscriptionCode })
      .eq('paystack_customer_code', customerCode);

    console.log('[paystack-webhook] subscription.create — stored code:', subscriptionCode);
  }

  // ── invoice.payment_success ───────────────────────────────────────────────
  // Fires on every successful auto-renewal. Extend next_renewal_at.
  else if (eventType === 'invoice.payment_success') {
    const customerCode: string = data.customer?.customer_code ?? '';
    if (!customerCode) return NextResponse.json({ ok: true });

    // Look up the user's current billing_period to compute the next renewal date.
    const { data: profile } = await admin
      .from('profiles')
      .select('billing_period')
      .eq('paystack_customer_code', customerCode)
      .maybeSingle();

    const period = profile?.billing_period ?? 'monthly';
    const nextRenewal = new Date(Date.now() + renewalDays(period) * 86_400_000);

    await admin.from('profiles').update({
      subscription_status: 'active',
      next_renewal_at:     nextRenewal.toISOString(),
    }).eq('paystack_customer_code', customerCode);

    // Record the renewal transaction if a reference is present.
    if (data.reference) {
      await admin.from('transactions').upsert({
        user_id:  (await admin.from('profiles').select('id').eq('paystack_customer_code', customerCode).maybeSingle()).data?.id,
        reference: data.reference,
        amount:   data.amount ?? 0,
        status:   'completed',
        provider: 'paystack',
      }, { onConflict: 'reference', ignoreDuplicates: true });
    }

    console.log('[paystack-webhook] invoice.payment_success — renewed for customer:', customerCode);
  }

  // ── subscription.disable ─────────────────────────────────────────────────
  // Fires when a subscription is cancelled or disabled.
  // We mark status cancelled but leave plan intact until next_renewal_at.
  // The daily cron (api/cron/downgrade-lapsed) is the actual downgrade trigger.
  else if (eventType === 'subscription.disable') {
    const subscriptionCode: string = data.subscription_code ?? '';
    if (!subscriptionCode) return NextResponse.json({ ok: true });

    await admin.from('profiles').update({
      subscription_status: 'cancelled',
    }).eq('paystack_subscription_code', subscriptionCode);

    console.log('[paystack-webhook] subscription.disable — marked cancelled:', subscriptionCode);
  }

  // All other events: return 200 so Paystack doesn't retry.
  return NextResponse.json({ ok: true });
}
