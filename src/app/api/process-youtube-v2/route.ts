import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

const PLAN_MAX: Record<string, number> = { free: 30, solo: 180, starter: 180, professional: 400, pro: 400, agency: 900 };

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

    const body = await req.json();
    const {
      videoUrl,
      limit = 5,
      ratio = 'RATIO_9_16',
      enableCaption = true,
      enableReframe = true,
      resolution = 'HD_1080',
      captionLanguage = 'en',
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required.' }, { status: 400 });
    }

    // Minute-quota pre-check (service role bypasses RLS)
    const admin = getAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('plan, minutes_used, minutes_reset_at, subscription_status, next_renewal_at')
      .eq('id', user.id)
      .single();

    if (profile) {
      // Belt-and-suspenders lapse check: if subscription was cancelled and renewal date passed,
      // treat them as free regardless of the plan column (cron may not have run yet).
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

      const cap = PLAN_MAX[profile.plan ?? 'free'] ?? 30;
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

    // Forward to backend
    const serverResponse = await fetch(`${BACKEND_API_URL}/api/process-youtube-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        userId: user.id,
        limit,
        ratio,
        enableCaption,
        enableReframe,
        resolution,
        captionLanguage,
      }),
    });

    const data = await serverResponse.json();

    // Store task_id → user mapping so clip-status can deduct on completion
    if (serverResponse.ok && data.task_id) {
      await admin.from('clip_jobs').insert({
        user_id: user.id,
        task_id: data.task_id,
        source_url: videoUrl,
        status: 'processing',
        num_clips: limit,
      });
    }

    return NextResponse.json(data, { status: serverResponse.status });

  } catch (error: any) {
    console.error('process-youtube-v2 error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
