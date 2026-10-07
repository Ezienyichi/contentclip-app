import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { insertNotification } from '@/lib/notify';
import { planMinutes } from '@/lib/planLimits';
import { minutesForJob, addMinutesUsed, saveClipsAdmin, normalizeClips } from '@/lib/job-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
        .select('id, minutes_charged, clips_saved, source_name')
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

        // Server-side clip save — idempotent via clips_saved compare-and-swap.
        // Runs whether or not the user is still on the page, so clips survive navigation.
        if (job && !job.clips_saved) {
          const rawClips = Array.isArray(data?.clips) ? data.clips : [];
          if (rawClips.length > 0) {
            const { data: claimed } = await admin
              .from('clip_jobs')
              .update({ clips_saved: true })
              .eq('id', job.id)
              .eq('clips_saved', false)
              .select('id')
              .maybeSingle();
            if (claimed) {
              await saveClipsAdmin(
                admin,
                user.id,
                normalizeClips(rawClips),
                job.source_name ?? task_id,
              );
            }
          }
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
