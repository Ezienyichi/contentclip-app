import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY||'', { apiVersion: '2024-12-18.acacia' as any });
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')||'';
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET||''); } catch { return NextResponse.json({ error: 'Bad sig' }, { status: 400 }); }
  if (event.type==='checkout.session.completed') console.log('Checkout completed');
  if (event.type==='customer.subscription.deleted') console.log('Sub cancelled');
  return NextResponse.json({ received: true });
}
