import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processCompletedJob } from '@/lib/job-utils';

export const dynamic = 'force-dynamic';

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Vercel cron every 5 minutes — rescues clip_jobs stuck in processing.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const admin = getAdmin();
  const stuckSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: jobs, error: qErr } = await admin
    .from('clip_jobs')
    .select('id, user_id, task_id, source, source_name, duration_seconds, clips_saved, minutes_charged')
    .eq('status', 'processing')
    .lte('updated_at', stuckSince)
    .limit(20);

  if (qErr) return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  if (!jobs || jobs.length === 0) return NextResponse.json({ swept: 0 });

  let completed = 0, failed = 0, still_processing = 0;
  const base   = process.env.BACKEND_API_URL ?? '';
  const secret = process.env.BACKEND_SHARED_SECRET ?? '';

  await Promise.allSettled(jobs.map(async (job) => {
    try {
      const isUpload = job.source === 'upload';
      const url = isUpload
        ? base + '/api/process-r2-status/' + encodeURIComponent(job.task_id)
        : base + '/api/clip-status/' + encodeURIComponent(job.task_id);
      const hdrs: Record<string, string> = {};
      if (isUpload && secret) hdrs['x-backend-secret'] = secret;

      const res  = await fetch(url, { headers: hdrs, signal: AbortSignal.timeout(15_000) });
      const data = await res.json().catch(() => ({}));

      if (data.status === 'completed' || data.status === 'SUCCEEDED') {
        await processCompletedJob(admin, job, { clips: data.clips, cost_usage: data.cost_usage });
        completed++;
      } else if (data.status === 'failed' || data.status === 'not_found' || res.status === 404) {
        await admin.from('clip_jobs').update({ status: 'failed' }).eq('id', job.id);
        failed++;
      } else {
        still_processing++;
      }
    } catch (e) {
      console.warn('[cron/clip-jobs-sweep] job', job.id, e instanceof Error ? e.message : e);
    }
  }));

  return NextResponse.json({ swept: jobs.length, completed, failed, still_processing });
}
