import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { insertNotification } from '@/lib/notify';

const PLAN_LIMITS: Record<string, number> = { free: 30, starter: 150, pro: 400, agency: 1200 };

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ task_id: string }> }
) {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { task_id } = await params;
    const serverResponse = await fetch(`${BACKEND_API_URL}/api/clip-status/${task_id}`);
    const data = await serverResponse.json();

    // On completion, deduct actual minutes used (idempotent via minutes_charged)
    console.log('[clip-status] status from backend:', data.status, '| ok:', serverResponse.ok);
    if (serverResponse.ok && (data.status === 'SUCCEEDED' || data.status === 'completed')) {
      console.log('[clip-status] DEDUCTION BLOCK ENTERED for task_id:', task_id, 'user:', user.id);
      const admin = getAdmin();

      const { data: job, error: jobErr } = await admin
        .from('clip_jobs')
        .select('id, minutes_charged')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single();

      console.log('[clip-status] job lookup — found:', !!job, '| minutes_charged:', job?.minutes_charged, '| error:', jobErr?.message ?? null);

      // Only deduct once — skip if already charged
      if (job && job.minutes_charged == null) {
        // cost_usage is WayinVideo API credits (~1.9 per input minute), not minutes.
        // Divide by 2 to approximate actual video minutes consumed.
        const rawCostUsage = data.cost_usage;
        const minutesUsed = Math.round((rawCostUsage ?? 0) / 2);
        console.log('[clip-status] cost_usage from backend:', rawCostUsage, '| minutesUsed (after /2):', minutesUsed);

        // Fetch profile before deduction so we can compute remaining minutes
        const { data: currentProfile, error: profileErr } = await admin
          .from('profiles')
          .select('minutes_used, plan')
          .eq('id', user.id)
          .single();

        console.log('[clip-status] profile fetch — minutes_used now:', currentProfile?.minutes_used, '| plan:', currentProfile?.plan, '| error:', profileErr?.message ?? null);

        if (minutesUsed > 0) {
          const newTotal = (currentProfile?.minutes_used ?? 0) + minutesUsed;
          console.log('[clip-status] writing minutes_used:', newTotal, 'to profiles for user:', user.id);
          const { error: updateErr } = await admin
            .from('profiles')
            .update({ minutes_used: newTotal })
            .eq('id', user.id);
          console.log('[clip-status] profile UPDATE result — error:', updateErr?.message ?? 'none (success)');
        } else {
          console.warn('[clip-status] minutesUsed is 0 — skipping profile UPDATE (cost_usage was:', rawCostUsage, ')');
        }

        const { error: jobUpdateErr } = await admin
          .from('clip_jobs')
          .update({ minutes_charged: minutesUsed, status: 'completed' })
          .eq('id', job.id);
        console.log('[clip-status] clip_jobs UPDATE result — error:', jobUpdateErr?.message ?? 'none (success)');

        // Clip-ready notification (fire and forget)
        void insertNotification({
          user_id: user.id,
          title: 'Your clip is ready!',
          body: 'Your clip has been processed and is ready to use.',
          type: 'clip_ready',
          link: '/import',
        });

        // Low-minutes warning (dedup: at most once per 24h)
        if (minutesUsed > 0 && currentProfile) {
          const planLimit = PLAN_LIMITS[currentProfile.plan ?? 'free'] ?? 30;
          const totalUsed = (currentProfile.minutes_used ?? 0) + minutesUsed;
          const remaining = planLimit - totalUsed;
          if (remaining < planLimit * 0.2) {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recent } = await admin
              .from('notifications')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'credits_low')
              .eq('read', false)
              .gte('created_at', since)
              .limit(1)
              .maybeSingle();
            if (!recent) {
              void insertNotification({
                user_id: user.id,
                title: 'Running low on minutes',
                body: `${Math.max(0, remaining)} of ${planLimit} minutes remaining. Upgrade to keep clipping.`,
                type: 'credits_low',
                link: '/settings',
              });
            }
          }
        }
      }
    }

    return NextResponse.json(data, { status: serverResponse.status });

  } catch (error: any) {
    console.error('clip-status error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
