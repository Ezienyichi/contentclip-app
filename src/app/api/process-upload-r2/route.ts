import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { planMinutes } from '@/lib/planLimits';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    let r2_url: string, category: string, prompt: string, numClips: number;
    let timeStart: number | undefined, timeEnd: number | undefined;
    try {
      const body = await req.json();
      r2_url   = String(body.r2_url   ?? '').trim();
      category = String(body.category ?? 'faith');
      prompt   = String(body.prompt   ?? '');
      numClips = Math.min(40, Math.max(1, Number(body.numClips) || 40));
      timeStart = body.timeStart != null ? Number(body.timeStart) : undefined;
      timeEnd   = body.timeEnd   != null ? Number(body.timeEnd)   : undefined;
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (!r2_url) {
      return NextResponse.json({ error: 'r2_url is required.' }, { status: 400 });
    }

    // Minute-quota pre-check (service role bypasses RLS)
    const admin = getAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('plan, minutes_used, minutes_reset_at, subscription_status, next_renewal_at')
      .eq('id', user.id)
      .single();

    if (profile) {
      // Lapse check: cancelled + past renewal date → treat as free
      if (
        profile.subscription_status === 'cancelled' &&
        profile.next_renewal_at &&
        new Date(profile.next_renewal_at) < new Date()
      ) {
        profile.plan = 'free';
      }

      // Lazy monthly reset
      const resetAt = profile.minutes_reset_at ? new Date(profile.minutes_reset_at) : new Date(0);
      const daysSinceReset = (Date.now() - resetAt.getTime()) / 86_400_000;
      if (daysSinceReset >= 30) {
        await admin
          .from('profiles')
          .update({ minutes_used: 0, minutes_reset_at: new Date().toISOString() })
          .eq('id', user.id);
        profile.minutes_used = 0;
      }

      const cap = planMinutes(profile.plan);
      if ((profile.minutes_used ?? 0) >= cap) {
        return NextResponse.json(
          {
            error: `You've used all ${cap} minutes on your ${profile.plan ?? 'free'} plan this month. Upgrade or wait for your monthly reset.`,
            code: 'QUOTA_EXCEEDED',
          },
          { status: 402 }
        );
      }
    }

    const backendSecret = process.env.BACKEND_SHARED_SECRET;
    if (!backendSecret) {
      console.error('[process-upload-r2] BACKEND_SHARED_SECRET not set');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const backendBody: Record<string, unknown> = {
      r2_url,
      userId: user.id,
      plan:   profile?.plan ?? 'free',
      numClips,
      category,
      prompt,
    };
    if (timeStart != null) backendBody.timeStart = timeStart;
    if (timeEnd   != null) backendBody.timeEnd   = timeEnd;

    const backendRes = await fetch(`${BACKEND_API_URL}/api/process-r2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-backend-secret': backendSecret,
      },
      body: JSON.stringify(backendBody),
    });

    const data = await backendRes.json();
    console.log('[process-upload-r2] backend', backendRes.status, JSON.stringify(data).slice(0, 200));
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err: any) {
    console.error('[process-upload-r2] error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
