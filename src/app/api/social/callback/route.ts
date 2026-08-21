import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';

// Service role client — bypasses RLS for the INSERT after OAuth redirect
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const isSuccess    = searchParams.get('isSuccess');
  const accountIds   = searchParams.get('accountIds') ?? '';
  const provider     = searchParams.get('provider') ?? '';
  const errorMsg     = searchParams.get('error');

  // ── Failure: PfM reported an error ──
  if (isSuccess !== 'true' || !accountIds) {
    const reason = encodeURIComponent(errorMsg ?? 'Connection cancelled or failed.');
    return NextResponse.redirect(`${APP_URL}/scheduler?error=${reason}`);
  }

  // PfM may return multiple accountIds (comma-separated); use the first
  const pfmAccountId = accountIds.split(',')[0].trim();

  if (!pfmAccountId) {
    return NextResponse.redirect(`${APP_URL}/scheduler?error=No+account+ID+returned.`);
  }

  // ── Fetch the connected account from PfM to get external_id + display info ──
  // external_id is our user.id, set server-side at connect time — cannot be forged by client
  const accountRes = await fetch(`${PFM_API}/social-accounts/${pfmAccountId}`, {
    headers: { 'Authorization': `Bearer ${process.env.POST_FOR_ME_API_KEY!}` },
  });

  let userId: string | null = null;
  let accountName: string | null = null;
  let accountAvatar: string | null = null;
  let platform = provider || 'unknown';

  if (accountRes.ok) {
    const account = await accountRes.json();
    userId       = account.external_id ?? null;
    accountName  = account.name ?? account.username ?? account.handle ?? null;
    accountAvatar= account.avatar_url ?? account.profile_image ?? null;
    platform     = account.platform ?? provider;
  } else {
    console.error('[social/callback] Failed to fetch PfM account', pfmAccountId, accountRes.status);
  }

  // ── Secondary: try session cookie (works on most browsers) ──
  if (!userId) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // session not available in this redirect context — external_id is primary
    }
  }

  if (!userId) {
    console.error('[social/callback] Could not identify user — no external_id and no session');
    return NextResponse.redirect(`${APP_URL}/scheduler?error=Could+not+identify+user.+Please+try+again.`);
  }

  // ── Upsert connection (handles re-connecting a previously disconnected account) ──
  const { error: dbError } = await supabaseAdmin
    .from('social_connections')
    .upsert(
      {
        user_id:        userId,
        platform,
        pfm_account_id: pfmAccountId,
        account_name:   accountName,
        account_avatar: accountAvatar,
        status:         'active',
        connected_at:   new Date().toISOString(),
      },
      { onConflict: 'user_id,platform,pfm_account_id' }
    );

  if (dbError) {
    console.error('[social/callback] DB upsert error', dbError);
    return NextResponse.redirect(`${APP_URL}/scheduler?error=Failed+to+save+connection.`);
  }

  return NextResponse.redirect(`${APP_URL}/scheduler?connected=${encodeURIComponent(platform)}`);
}
