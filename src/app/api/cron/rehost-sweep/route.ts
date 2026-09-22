import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sweepOrphanClips,
  triggerSweep,
  missingR2Env,
  SWEEP_BATCH,
  SWEEP_MAX_AGE_HOURS,
} from '@/lib/rehost';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Sweeps clips still pointing at an expiring WayinVideo/CloudFront URL into R2.
// Picks up whatever clips/save couldn't finish inside its own 60s budget —
// clips ~21-40 of a large video.
//
// Triggered two ways:
//   1. Chained from clips/save (and from itself) — each hop gets a fresh 60s,
//      so a 40-clip job drains in a few minutes. This is the one that beats
//      the WayinVideo expiry.
//   2. Vercel Cron daily — backstop only. Hobby caps cron at once per day,
//      which alone is too slow, so it exists to catch what chaining missed.
//
// Auth: `Authorization: Bearer $CRON_SECRET`, which Vercel Cron sends
// automatically when CRON_SECRET is set. Fails CLOSED if the secret is unset —
// unlike cron/downgrade-lapsed, which goes open in that case. This route spends
// R2 writes and egress, so it must never be publicly callable.

const LABEL = '[rehost-sweep]';

// Stop starting new uploads with ~15s left so the function returns a real
// summary instead of being killed mid-flight with nothing logged.
const TIME_BUDGET_MS = 45_000;

export async function GET(req: NextRequest) {
  const startedAt = Date.now();

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(`${LABEL} CRON_SECRET is not set — refusing to run`);
    return NextResponse.json({ error: 'Sweep not configured.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const missing = missingR2Env();
  if (missing.length) {
    console.error(`${LABEL} missing R2 env vars:`, missing.join(', '));
    return NextResponse.json({ error: `Missing R2 env: ${missing.join(', ')}` }, { status: 500 });
  }

  const url = new URL(req.url);
  const hop = Math.max(0, Number(url.searchParams.get('hop')) || 0);
  const batch = Math.min(25, Math.max(1, Number(url.searchParams.get('batch')) || SWEEP_BATCH));
  const maxAgeHours = Math.max(
    1,
    Number(url.searchParams.get('maxAgeHours')) || SWEEP_MAX_AGE_HOURS
  );

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const runSweep = async () => {
    const result = await sweepOrphanClips({
      db,
      batch,
      maxAgeHours,
      deadlineAt: startedAt + TIME_BUDGET_MS,
      label: `${LABEL} hop=${hop}`,
    });

    // More orphans in the window than this pass could take — hand off to a
    // fresh 60s budget.
    if (result.remaining > 0) {
      await triggerSweep(hop + 1, LABEL);
    }
    return result;
  };

  // ?wait=1 runs synchronously and returns the counts — for manual debugging.
  if (url.searchParams.get('wait') === '1') {
    try {
      const result = await runSweep();
      return NextResponse.json({ ...result, hop, elapsedMs: Date.now() - startedAt });
    } catch (err) {
      console.error(`${LABEL} failed:`, err instanceof Error ? err.message : String(err));
      return NextResponse.json({ error: 'Sweep failed.' }, { status: 500 });
    }
  }

  // Default: acknowledge immediately, sweep in the background. This is what
  // makes chaining safe — the caller's fetch resolves in milliseconds, so it
  // never has to abort a long request, and an abort can't risk tearing down
  // this invocation before its work is done.
  after(async () => {
    try {
      await runSweep();
    } catch (err) {
      console.error(`${LABEL} failed:`, err instanceof Error ? err.message : String(err));
    }
  });

  return NextResponse.json({ accepted: true, hop });
}
