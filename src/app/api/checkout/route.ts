import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY||'', { apiVersion: '2024-12-18.acacia' as any });
export async function POST(request: NextRequest) {
  try {
    const { plan, email, userId } = await request.json();
    const prices:Record<string,number> = { solo: 900, professional: 2400, agency: 7900 };
    if (!prices[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: plan+' Plan' }, recurring: { interval: 'month' }, unit_amount: prices[plan] }, quantity: 1 }],
      customer_email: email, metadata: { userId, plan },
      success_url: (process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000')+'/dashboard?upgraded=true',
      cancel_url: (process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000')+'/pricing' });
    return NextResponse.json({ url: session.url });
  } catch { return NextResponse.json({ error: 'Checkout failed' }, { status: 500 }); }
}
