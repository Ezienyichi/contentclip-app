import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { insertNotification } from '@/lib/notify';
import { planMinutes } from '@/lib/planLimits';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

/**
 * Minutes to charge for a completed job, plus how we arrived at the number
 * (logged, so a job that records nothing can be diagnosed from the server log).
 */
function minutesForJob(data: any): { minutes: number; basis: string } {
  const cost = Number(data?.cost_usage);

  if (Number.isFinite(cost) && cost > 0) {
    // cost_usage is WayinVideo API credits (~1.9 per input minute), not minutes.
    // Ceil rather than round, with a floor of 1: Math.round() charged 0 for
    // anything under ~30s of source video, i.e. processed it for free.
    return { minutes: Math.max(1, Math.ceil(cost / 2)), basis: `cost_usage=${cost}` };
  }

  // Backend omitted cost_usage. Fall back to how far into the source video the
  // returned clips reach — a lower bound on the footage actually processed.
  const ends: number[] = (Array.isArray(data?.clips) ? data.clips : [])
    .map((c: any) => Number(c?.end_time))
    .filter((n: number) => Number.isFinite(n) && n > 0);

  if (ends.length > 0) {
    const span = Math.max(...ends);
    return {
      minutes: Math.max(1, Math.ceil(span / 60)),
      basis:   `clip span ${Math.round(span)}s (cost_usage missing)`,
    };
  }

  return { minutes: 0, basis: 'indeterminate' };
}

/**
 * profiles.minutes_used += delta, atomically where the RPC is installed
 * (supabase/increment_minutes_used.sql). Falls back to read-modify-write so
 * this keeps working before that migration is applied.
 */
async function addMinutesUsed(
  admin: SupabaseClient,
  userId: string,
  delta: number,
  knownCurrent: number,
): Promise<void> {
  const { error: rpcErr } = await admin.rpc('increment_minutes_used', {
    p_user_id: userId,
    p_minutes: delta,
  });
  if (!rpcErr) {
    console.log('[clip-status] minutes_used +=', delta, 'for user', userId);
    return;
  }

  console.warn('[clip-status] increment_minutes_used RPC unavailable, falling back to read-modify-write:', rpcErr.message);
  const { error } = await admin
    .from('profiles')
    .update({ minutes_used: knownCurrent + delta })
    .eq('id', userId);

  if (error) console.error('[clip-status] minutes_used update FAILED:', error.message);
  else       console.log('[clip-status] minutes_used set to', knownCurrent + delta, 'for user', userId);
}

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
        const { minutes: minutesUsed, basis } = minutesForJob(data);
        console.log('[clip-status] minutes for task', task_id, '=', minutesUsed, '| basis:', basis);

        // Fetch profile before deduction so we can compute remaining minutes
        const { data: currentProfile, error: profileErr } = await admin
          .from('profiles')
          .select('minutes_used, plan')
          .eq('id', user.id)
          .single();

        console.log('[clip-status] profile fetch — minutes_used now:', currentProfile?.minutes_used, '| plan:', currentProfile?.plan, '| error:', profileErr?.message ?? null);

        if (minutesUsed > 0) {
          // Claim the job BEFORE touching the profile. The browser polls on an
          // interval, so two requests can both see SUCCEEDED with
          // minutes_charged still null; `.is('minutes_charged', null)` means
          // exactly one of them matches a row and the job can't be charged twice.
          const { data: claimed, error: claimErr } = await admin
            .from('clip_jobs')
            .update({ minutes_charged: minutesUsed, status: 'completed' })
            .eq('id', job.id)
            .is('minutes_charged', null)
            .select('id')
            .maybeSingle();

          if (claimErr) {
            console.error('[clip-status] clip_jobs claim FAILED:', claimErr.message);
          } else if (claimed) {
            await addMinutesUsed(admin, user.id, minutesUsed, currentProfile?.minutes_used ?? 0);
          } else {
            console.log('[clip-status] task', task_id, 'already charged by a concurrent poll — skipping');
          }
        } else {
          // Deliberately leave minutes_charged NULL. The previous code wrote
          // minutes_charged: 0 here, which permanently marked the job charged
          // (the guard above is `minutes_charged == null`), so those minutes
          // could never be recovered and the account kept clipping for free.
          console.error(
            '[clip-status] could not determine minutes for task', task_id,
            '— leaving job UNCHARGED so it can be recovered. cost_usage was:', data?.cost_usage,
          );
          await admin
            .from('clip_jobs')
            .update({ status: 'completed' })
            .eq('id', job.id);
        }

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
          const planLimit = planMinutes(currentProfile.plan);
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
