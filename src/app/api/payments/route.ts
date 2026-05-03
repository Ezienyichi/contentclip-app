import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://contentclip-app-w2hf.vercel.app";

export const PLANS = {
  starter: {
    name: "HookClip Starter",
    amount: 29,
    credits: 2000,
    currency: "USD",
  },
  creator: {
    name: "HookClip Creator",
    amount: 59,
    credits: 5000,
    currency: "USD",
  },
  business: {
    name: "HookClip Business",
    amount: 99,
    credits: 15000,
    currency: "USD",
  },
} as const;

type PlanKey = keyof typeof PLANS;

// POST /api/payments — initiate Paystack checkout
export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json();

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "userId and plan are required" },
        { status: 400 }
      );
    }

    if (!PLANS[plan as PlanKey]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paystack not configured" },
        { status: 500 }
      );
    }

    // Get user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planDetails = PLANS[plan as PlanKey];
    const reference = `hookclip-${userId}-${Date.now()}`;

    // Paystack uses kobo (multiply USD by 100 for cents, then convert)
    // For simplicity charge in NGN or USD — Paystack supports both
    // Amount in lowest currency unit (cents for USD)
    const amountInCents = planDetails.amount * 100;

    const payload = {
      email: profile.email,
      amount: amountInCents,
      currency: planDetails.currency,
      reference,
      callback_url: `${APP_URL}/api/payments/callback`,
      metadata: {
        user_id: userId,
        plan,
        credits: planDetails.credits,
        full_name: profile.full_name ?? "",
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: planDetails.name },
          { display_name: "Credits", variable_name: "credits", value: String(planDetails.credits) },
        ],
      },
    };

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message ?? "Paystack error" },
        { status: 500 }
      );
    }

    // Save pending transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      tx_ref: reference,
      plan,
      amount: planDetails.amount,
      currency: planDetails.currency,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      paymentLink: data.data.authorization_url,
      reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/payments/callback — Paystack redirect after payment
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(`${APP_URL}/pricing?payment=failed`);
  }

  try {
    // Verify transaction with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (
      !verifyData.status ||
      verifyData.data?.status !== "success"
    ) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=failed`);
    }

    const meta = verifyData.data.metadata;
    const userId = meta?.user_id;
    const plan = meta?.plan as PlanKey;
    const credits = meta?.credits as number;

    if (!userId || !plan) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=error`);
    }

    // Upgrade user plan and credits
    const { error: upgradeError } = await supabase
      .from("profiles")
      .update({
        plan,
        credits,
      })
      .eq("id", userId);

    if (upgradeError) {
      console.error("Failed to upgrade user:", upgradeError);
      return NextResponse.redirect(`${APP_URL}/pricing?payment=error`);
    }

    // Update transaction status
    await supabase
      .from("transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("tx_ref", reference);

    // Send confirmation email
    await fetch(`${APP_URL}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_success",
        userId,
        data: {
          plan,
          credits,
          amount: verifyData.data.amount / 100,
        },
      }),
    });

    return NextResponse.redirect(
      `${APP_URL}/dashboard?payment=success&plan=${plan}`
    );
  } catch (err) {
    console.error("[payments/callback]", err);
    return NextResponse.redirect(`${APP_URL}/pricing?payment=error`);
  }
}

// POST /api/payments/webhook — Paystack webhook for server-side verification
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, metadata, amount } = event.data;
      const userId = metadata?.user_id;
      const plan = metadata?.plan as PlanKey;
      const credits = metadata?.credits as number;

      if (userId && plan && credits) {
        await supabase
          .from("profiles")
          .update({ plan, credits })
          .eq("id", userId);

        await supabase
          .from("transactions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("tx_ref", reference);

        // Send email
        await fetch(`${APP_URL}/api/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment_success",
            userId,
            data: { plan, credits, amount: amount / 100 },
          }),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[payments/webhook]", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
