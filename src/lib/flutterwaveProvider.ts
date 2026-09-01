// All Flutterwave-specific logic is isolated here.
// To swap payment providers, rewrite only this file.

const BASE = 'https://api.flutterwave.com/v3';

function secretKey() {
  const k = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!k) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');
  return k;
}

async function fwGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message ?? `FW error: ${path}`);
  return json.data;
}

async function fwPost(path: string, body: Record<string, unknown>) {
  console.log(`[FW] POST ${path} payload:`, JSON.stringify(body));
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  console.log(`[FW] POST ${path} http=${res.status} response:`, JSON.stringify(json));
  if (json.status !== 'success') throw new Error(json.message ?? `FW error: ${path}`);
  return json.data;
}

// ── Webhook ──────────────────────────────────────────────────────────────────

// Flutterwave uses a static shared secret header — not HMAC.
export function verifyWebhookHash(incomingHash: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  if (!expected || !incomingHash) return false;
  return incomingHash === expected;
}

export interface VerifiedTx {
  status:   string;
  amount:   number;
  currency: string;
  tx_ref:   string;
  meta:     Record<string, unknown> | null;
  customer: { email: string };
}

export async function verifyTransaction(transactionId: number): Promise<VerifiedTx> {
  const data = await fwGet(`/transactions/${transactionId}/verify`);
  return {
    status:   data.status,
    amount:   data.amount,
    currency: data.currency,
    tx_ref:   data.tx_ref,
    meta:     data.meta ?? null,
    customer: { email: data.customer?.email ?? '' },
  };
}

// ── Checkout ─────────────────────────────────────────────────────────────────

export interface InitParams {
  email:          string;
  name:           string;
  amount:         number;
  currency:       'USD' | 'NGN';
  txRef:          string;
  redirectUrl:    string;
  meta:           Record<string, unknown>;
  paymentPlanId?: number;
}

export async function initializePayment(p: InitParams): Promise<{ payment_link: string }> {
  const planLabel = typeof p.meta.plan === 'string'
    ? p.meta.plan.charAt(0).toUpperCase() + p.meta.plan.slice(1)
    : 'Subscription';

  const body: Record<string, unknown> = {
    tx_ref:       p.txRef,
    amount:       p.amount,
    currency:     p.currency,
    redirect_url: p.redirectUrl,
    customer:     { email: p.email, name: p.name },
    meta:         p.meta,
    customizations: {
      title:       'VangelClip',
      description: `VangelClip subscription – ${planLabel}`,
      logo:        process.env.NEXT_PUBLIC_LOGO_URL ?? '',
    },
  };
  if (p.paymentPlanId) body.payment_plan = p.paymentPlanId;
  const data = await fwPost('/payments', body);
  return { payment_link: data.link };
}

export async function ensurePaymentPlan(p: {
  name: string; amount: number; currency: 'USD' | 'NGN'; interval: 'monthly' | 'yearly';
}): Promise<number> {
  const data = await fwPost('/payment-plans', {
    amount:   p.amount,
    name:     p.name,
    interval: p.interval,
    currency: p.currency,
    duration: 0,
  });
  return data.id as number;
}
