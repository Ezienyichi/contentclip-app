import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
  }

  const body = await req.json();

  // ── REFUND PATH ──
  if (body.action === 'refund') {
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount.' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    const current = profile?.credits ?? 0;

    await supabase
      .from('profiles')
      .update({ credits: current + amount })
      .eq('id', user.id);

    return NextResponse.json({ ok: true, credits_remaining: current + amount });
  }

  // ── DEDUCT PATH ──
  const creditsNeeded = Number(body.creditsNeeded);
  if (!creditsNeeded || creditsNeeded <= 0) {
    return NextResponse.json({ error: 'Invalid credits amount.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single();

  const credits = profile?.credits ?? 0;

  if (credits < creditsNeeded) {
    return NextResponse.json(
      {
        error: `Not enough credits. You need ${creditsNeeded} but have ${credits} remaining.`,
        credits_remaining: credits,
        credits_required: creditsNeeded,
      },
      { status: 402 }
    );
  }

  // Compare-and-swap deduct (matches the process route pattern)
  const { error: deductError } = await supabase
    .from('profiles')
    .update({ credits: credits - creditsNeeded })
    .eq('id', user.id)
    .eq('credits', credits);

  if (deductError) {
    return NextResponse.json(
      { error: 'Failed to deduct credits. Please try again.' },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, credits_remaining: credits - creditsNeeded });
}
