import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/adminAuth';
import {
  sweepOrphanClips,
  isR2Url,
  missingR2Env,
  SWEEP_BATCH,
  SWEEP_MAX_AGE_HOURS,
} from '@/lib/rehost';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Manual/one-off version of the sweep in api/cron/rehost-sweep, for rescuing
// clips by hand. Same core (lib/rehost sweepOrphanClips) so the two can't
// drift; the differences are that this one is admin-triggered, does not chain,
// and supports ?dry=1.
//
// Auth: admin session, or `Authorization: Bearer $CRON_SECRET`.
//
//   curl -X POST "https://<host>/api/admin/rehost-orphans?dry=1" \
//     -H "Authorization: Bearer $CRON_SECRET"

const LABEL = '[rehost-orphans]';
const TIME_BUDGET_MS = 45_000;

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function authorize(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return true;
  }
  const { isAdmin } = await checkAdminAuth();
  return isAdmin;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  if (!await authorize(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const missing = missingR2Env();
  if (missing.length) {
    return NextResponse.json({ error: `Missing R2 env: ${missing.join(', ')}` }, { status: 500 });
  }

  const url = new URL(req.url);
  const batch = Math.min(25, Math.max(1, Number(url.searchParams.get('batch')) || SWEEP_BATCH));
  const maxAgeHours = Math.max(
    1,
    Number(url.searchParams.get('maxAgeHours')) || SWEEP_MAX_AGE_HOURS
  );
  const db = adminSupabase();

  // ?dry=1 — report what would be swept, change nothing.
  if (url.searchParams.get('dry') === '1') {
    const since = new Date(Date.now() - maxAgeHours * 3_600_000).toISOString();
    const { data, error } = await db
      .from('clips')
      .select('id, video_url, created_at, expires_at')
      .neq('status', 'error')
      .not('video_url', 'is', null)
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const orphans = (data ?? []).filter(
      r => typeof r.video_url === 'string'
        && r.video_url.startsWith('http')
        && !isR2Url(r.video_url)
    );

    return NextResponse.json({
      dryRun: true,
      maxAgeHours,
      orphansInWindow: orphans.length,
      wouldProcess: Math.min(batch, orphans.length),
      oldest: orphans.slice(0, 5).map(o => ({
        id: o.id,
        created_at: o.created_at,
        expires_at: o.expires_at,
        host: (() => { try { return new URL(o.video_url).host; } catch { return '?'; } })(),
      })),
    });
  }

  try {
    const result = await sweepOrphanClips({
      db,
      batch,
      maxAgeHours,
      deadlineAt: startedAt + TIME_BUDGET_MS,
      label: LABEL,
    });

    return NextResponse.json({
      ...result,
      done: result.remaining === 0,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(`${LABEL} failed:`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Sweep failed.' }, { status: 500 });
  }
}
