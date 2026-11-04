import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processCompletedJob } from '@/lib/job-utils';

export const dynamic = 'force-dynamic';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Called by the backend when a clip job finishes.
// Protected by BACKEND_SHARED_SECRET so only the backend can trigger it.
export async function POST(req: NextRequest) {
  const incoming = req.headers.get('x-backend-secret');
  const expected = process.env.BACKEND_SHARED_SECRET;

  if (!expected) {
    console.error('[webhooks/clip-ready] BACKEND_SHARED_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }
  if (!incoming || incoming !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let task_id: string, status: string, clips: any[], cost_usage: number | undefined;
  try {
    const body  = await req.json();
    task_id     = String(body.task_id  ?? '').trim();
    status      = String(body.status   ?? '');
    clips       = Array.isArray(body.clips) ? body.clips : [];
    cost_usage  = body.cost_usage != null ? Number(body.cost_usage) : undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!task_id) return NextResponse.json({ error: 'task_id is required.' }, { status: 400 });

  const admin = getAdmin();

  const { data: job, error: jobErr } = await admin
    .from('clip_jobs')
    .select('id, user_id, source_name, duration_seconds, clips_saved, minutes_charged')
    .eq('task_id', task_id)
    .eq('status', 'processing')
    .maybeSingle();

  if (jobErr) {
    console.error('[webhooks/clip-ready] DB error', task_id, jobErr);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  if (!job) {
    // Already processed or unknown — 200 so backend stops retrying
    return NextResponse.json({ ok: true });
  }

  if (status === 'completed' || status === 'SUCCEEDED') {
    await processCompletedJob(admin, job, { clips, cost_usage });
  } else if (status === 'failed') {
    await admin.from('clip_jobs').update({ status: 'failed' }).eq('id', job.id);
  }

  return NextResponse.json({ ok: true });
}
