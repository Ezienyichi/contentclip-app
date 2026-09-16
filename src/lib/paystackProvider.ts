// All Paystack-specific logic is isolated here.
// To swap payment providers, rewrite only this file.
import { createHmac, timingSafeEqual } from 'crypto';

const BASE = 'https://api.paystack.co';

function secretKey() {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return k;
}

async function psPost(path: string, body: Record<string, unknown>) {
  console.log(`[PS] POST ${path} payload:`, JSON.stringify(body));
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  console.log(`[PS] POST ${path} http=${res.status} response:`, JSON.stringify(json));
  if (!json.status) throw new Error(json.message ?? `Paystack error on ${path}`);
  return json.data;
}

async function psGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message ?? `Paystack error on ${path}`);
  return json.data;
}

// ── Webhook ───────────────────────────────────────────────────────────────────

// rawBody must be the unmodified request bytes — do NOT call req.json() before this.
// Paystack signs the raw body with HMAC-SHA512 using the secret key.
export function verifyWebhookSignature(rawBody: Buffer, header: string | null): boolean {
  if (!header) return false;
  const expected = createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(header, 'utf8'));
  } catch {
    return false;
  }
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export interface InitParams {
  email:       string;
  amountKobo:  number;   // amount * 100 (Paystack subunits: kobo for NGN, cents for USD)
  currency:    'NGN' | 'USD';
  reference:   string;
  callbackUrl: string;
  metadata:    Record<string, unknown>;
}

// Returns { payment_link } — matching the field name used by the FW integration
// so the frontend callers (pricing page, UpgradeModal) need no changes.
export async function initializeTransaction(p: InitParams): Promise<{ payment_link: string }> {
  const data = await psPost('/transaction/initialize', {
    email:        p.email,
    amount:       p.amountKobo,
    currency:     p.currency,
    reference:    p.reference,
    callback_url: p.callbackUrl,
    metadata:     p.metadata,
  });
  return { payment_link: data.authorization_url };
}

// ── Verify ────────────────────────────────────────────────────────────────────

export interface VerifiedTx {
  status:    string;            // 'success' | 'failed' | 'abandoned' etc.
  amount:    number;            // in subunits (kobo / cents)
  currency:  string;
  reference: string;
  metadata:  Record<string, unknown>;
  customer:  { email: string };
}

// Called from the webhook to get the authoritative transaction state from Paystack.
// Never trust the webhook payload amount — always verify via this API.
export async function verifyTransaction(reference: string): Promise<VerifiedTx> {
  const data = await psGet(`/transaction/verify/${encodeURIComponent(reference)}`);
  return {
    status:    data.status,
    amount:    data.amount,
    currency:  data.currency,
    reference: data.reference,
    metadata:  data.metadata ?? {},
    customer:  { email: data.customer?.email ?? '' },
  };
}
