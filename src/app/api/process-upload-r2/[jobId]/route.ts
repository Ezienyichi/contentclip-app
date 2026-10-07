import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { insertNotification } from '@/lib/notify';
import { planMinutes } from '@/lib/planLimits';
import { minutesForJob, addMinutesUsed, saveClipsAdmin, normalizeClips } from '@/lib/job-utils';

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
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
    }

    const backendSecret = process.env.BACKEND_SHARED_SECRET;
    if (!backendSecret) {
      console.error('[process-upload-r2/status] BACKEND_SHARED_SECRET not set');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const backendRes = await fetch(
      `${BACKEND_API_URL}/api/process-r2-status/${encodeURIComponent(jobId)}`,
      { headers: { 'x-backend-secret': backendSecret } }
    );

    const data = await backendRes.json();

    if (backendRes.ok && (data.status === 'completed')) {
      const admin = getAdmin();

      const { data: job } = await admin
        .from('clip_jobs')
        .select('id, minutes_charged, clips_saved, source_name, duration_seconds')
        .eq('task_id', jobId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (job) {
        const rawClips = Array.isArray(data?.clips) ? data.clips : [];

        // Server-side clip save — idempotent via clips_saved compare-and-swap
        if (!job.clips_saved && rawClips.length > 0) {
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
              job.source_name ?? jobId,
            );
          }
        }

        // Minute deduction — idempotent via minutes_charged compare-and-swap
        if (job.minutes_charged == null) {
          let jobData = { ...data };
          // For uploads the backend may not return cost_usage; fall back to duration_seconds
          if (!jobData.cost_usage && job.duration_seconds) {
            jobData = { ...jobData, clips: [{ end_time: job.duration_seconds }] };
          }
          const { minutes: minutesUsed, basis } = minutesForJob(jobData);
          console.log('[process-upload-r2/status] minutes for job', jobId, '=', minutesUsed, '| basis:', basis);

          if (minutesUsed > 0) {
            const { data: profile } = await admin
              .from('profiles')
              .select('minutes_used, plan')
              .eq('id', user.id)
              .single();

            const { data: charged } = await admin
              .from('clip_jobs')
              .update({ minutes_charged: minutesUsed, status: 'completed' })
              .eq('id', job.id)
              .is('minutes_charged', null)
              .select('id')
              .maybeSingle();

            if (charged) {
              await addMinutesUsed(admin, user.id, minutesUsed, profile?.minutes_used ?? 0);

              // Low-minutes warning (dedup: at most once per 24h)
              if (profile) {
                const planLimit = planMinutes(profile.plan);
                const totalUsed = (profile.minutes_used ?? 0) + minutesUsed;
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
          } else {
            await admin
              .from('clip_jobs')
              .update({ status: 'completed' })
              .eq('id', job.id);
          }
        }

        // Clip-ready notification (fire and forget)
        void insertNotification({
          user_id: user.id,
          title: 'Your clip is ready!',
          body: 'Your uploaded video has been processed and clips are ready.',
          type: 'clip_ready',
          link: '/import',
        });
      }
    }

    if (backendRes.ok && (data.status === 'failed' || data.status === 'not_found')) {
      const admin = getAdmin();
      await admin
        .from('clip_jobs')
        .update({ status: 'failed' })
        .eq('task_id', jobId)
        .eq('user_id', user.id);
    }

    return NextResponse.json(data, { status: backendRes.status });

  } catch (err: any) {
    console.error('[process-upload-r2/status] error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
