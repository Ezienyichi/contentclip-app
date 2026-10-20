// Admin-only endpoint: diagnoses PfM 404 failures.
// Authorization: Bearer $CRON_SECRET
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PFM_API = 'https://api.postforme.dev/v1';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth   = req.headers.get('authorization') ?? '';
  if (!secret || auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Find failed posts whose error_message contains "404"
  const { data: failedPosts } = await admin
    .from('scheduled_posts')
    .select('id, platform, pfm_post_id, social_connection_id, error_message, scheduled_at, clip_id, clips(video_url, download_url)')
    .eq('status', 'failed')
    .ilike('error_message', '%404%')
    .order('scheduled_at', { ascending: false })
    .limit(50);

  if (!failedPosts || failedPosts.length === 0)
    return NextResponse.json({ message: 'No failed posts with 404 errors found.', posts: [] });

  // 2. Fetch all PfM social accounts
  const pfmApiKey = process.env.POST_FOR_ME_API_KEY;
  let pfmAccountIds = new Set<string>();
  let pfmAccountsErr: string | null = null;
  if (pfmApiKey) {
    try {
      const res  = await fetch(`${PFM_API}/social-accounts`, {
        headers: { Authorization: `Bearer ${pfmApiKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const json = await res.json();
        const accounts = json.data ?? json.accounts ?? json ?? [];
        if (Array.isArray(accounts)) {
          for (const a of accounts) {
            if (a.id) pfmAccountIds.add(String(a.id));
          }
        }
      } else {
        pfmAccountsErr = `PfM /social-accounts returned ${res.status}`;
      }
    } catch (e) {
      pfmAccountsErr = `PfM /social-accounts threw: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    pfmAccountsErr = 'POST_FOR_ME_API_KEY not set';
  }

  // 3. For each failed post, diagnose cause
  const results = await Promise.all(failedPosts.map(async post => {
    // Fetch social connection for pfm_account_id
    let pfm_account_id: string | null = null;
    if (post.social_connection_id) {
      const { data: conn } = await admin
        .from('social_connections')
        .select('pfm_account_id, account_name, platform')
        .eq('id', post.social_connection_id)
        .single();
      pfm_account_id = conn?.pfm_account_id ?? null;
    }

    const clip = (post as any).clips as { video_url?: string; download_url?: string } | null;
    const mediaUrl = clip?.video_url ?? clip?.download_url ?? null;

    // Check if pfm_account_id exists in PfM
    let accountStatus: 'exists' | 'missing' | 'unknown' = 'unknown';
    if (pfmAccountIds.size > 0 && pfm_account_id) {
      accountStatus = pfmAccountIds.has(pfm_account_id) ? 'exists' : 'missing';
    }

    // Check if media URL is reachable
    let mediaStatus: 'ok' | 'not_found' | 'expired' | 'unknown' | 'no_url' = 'unknown';
    let mediaHttpStatus: number | null = null;
    if (!mediaUrl) {
      mediaStatus = 'no_url';
    } else {
      try {
        const r = await fetch(mediaUrl, { method: 'HEAD', signal: AbortSignal.timeout(8_000) });
        mediaHttpStatus = r.status;
        mediaStatus = r.ok ? 'ok' : (r.status === 404 ? 'not_found' : 'expired');
      } catch {
        mediaStatus = 'unknown';
      }
    }

    // Determine likely root cause
    let likelyCause: string;
    if (accountStatus === 'missing') {
      likelyCause = 'pfm_account_id no longer exists in Post for Me — account was disconnected or token revoked';
    } else if (mediaStatus === 'not_found' || mediaStatus === 'expired') {
      likelyCause = `Media URL unreachable (HTTP ${mediaHttpStatus ?? '?'}) — likely an expired WayinVideo/CloudFront signed URL`;
    } else if (!pfm_account_id) {
      likelyCause = 'No pfm_account_id found in social_connections row — may have been created before spc_→sa_ ID fix';
    } else if (pfm_account_id.startsWith('spc_')) {
      likelyCause = 'pfm_account_id starts with spc_ — old connection ID format sent to PfM, which expects sa_ account IDs';
    } else if (mediaUrl && mediaUrl.includes('cloudfront.net')) {
      likelyCause = 'Media URL is a CloudFront signed URL — it expired before PfM could download it at posting time';
    } else {
      likelyCause = 'Unknown — PfM returned 404 for an undiagnosed reason (see error_message)';
    }

    return {
      post_id:         post.id,
      platform:        post.platform,
      scheduled_at:    post.scheduled_at,
      error_message:   post.error_message,
      pfm_account_id,
      account_in_pfm:  accountStatus,
      media_url:       mediaUrl,
      media_status:    mediaStatus,
      media_http:      mediaHttpStatus,
      likely_cause:    likelyCause,
    };
  }));

  // Summary
  const causeCounts: Record<string, number> = {};
  for (const r of results) {
    const key = r.likely_cause.split(' — ')[0];
    causeCounts[key] = (causeCounts[key] ?? 0) + 1;
  }

  return NextResponse.json({
    total_404_failures: results.length,
    pfm_accounts_fetched: pfmAccountIds.size,
    pfm_accounts_err:   pfmAccountsErr,
    cause_summary:      causeCounts,
    posts:              results,
  });
}
