// All Paystack-specific logic is isolated here.
// To swap payment providers (e.g. Flutterwave), rewrite only this file.
import { createHmac } from 'crypto';

const BASE = 'https://api.paystack.co';

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

async function paystackPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message ?? `Paystack error on ${path}`);
  return json.data;
}

export interface InitParams {
  email:       string;
  amountKobo:  number;
  reference:   string;
  metadata:    Record<string, unknown>;
  callbackUrl: string;
  planCode?:   string;   // for subscriptions
}

export async function initializeTransaction(p: InitParams): Promise<{ authorization_url: string }> {
  const body: Record<string, unknown> = {
    email:        p.email,
    amount:       p.amountKobo,
    reference:    p.reference,
    metadata:     p.metadata,
    callback_url: p.callbackUrl,
  };
  if (p.planCode) body.plan = p.planCode;

  const data = await paystackPost('/transaction/initialize', body);
  return { authorization_url: data.authorization_url };
}

// Verify the x-paystack-signature header on incoming webhook requests.
// rawBody must be the unmodified request bytes — do NOT JSON.parse first.
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac('sha512', secretKey())
    .update(rawBody)
    .digest('hex');
  return expected === signatureHeader;
}

export interface PlanParams {
  name:        string;
  amountKobo:  number;
  interval:    'monthly' | 'annually';
}

export async function ensurePaystackPlan(p: PlanParams): Promise<string> {
  // Paystack doesn't have a "get-or-create" — we attempt to create;
  // if a plan with this name exists, Paystack returns the existing plan_code.
  const data = await paystackPost('/plan', {
    name:     p.name,
    amount:   p.amountKobo,
    interval: p.interval,
  });
  return data.plan_code as string;
}

export async function createSubscription(customerCode: string, planCode: string): Promise<string> {
  const data = await paystackPost('/subscription', {
    customer: customerCode,
    plan:     planCode,
  });
  return data.subscription_code as string;
}
