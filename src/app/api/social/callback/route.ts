import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const isSuccess = searchParams.get('isSuccess');
  const accountIds = searchParams.get('accountIds') ?? '';
  const provider   = searchParams.get('provider') ?? '';
  const errorMsg   = searchParams.get('error');

  if (isSuccess !== 'true' || !accountIds) {
    const reason = encodeURIComponent(errorMsg ?? 'Connection cancelled or failed.');
    return NextResponse.redirect(`${APP_URL}/scheduler?error=${reason}`);
  }

  // PfM may return multiple accountIds (comma-separated) — one per Facebook Page, etc.
  // Store ALL of them so each page becomes its own selectable connection.
  const allAccountIds = accountIds.split(',').map(s => s.trim()).filter(Boolean);

  if (allAccountIds.length === 0) {
    return NextResponse.redirect(`${APP_URL}/scheduler?error=No+account+ID+returned.`);
  }

  // Fetch all accounts from PfM in parallel to get display info + external_id
  const accountResults = await Promise.all(
    allAccountIds.map(id =>
      fetch(`${PFM_API}/social-accounts/${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.POST_FOR_ME_API_KEY!}` },
      })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  // Resolve userId: all accounts share the same external_id (set at connect time, cannot be forged)
  let userId: string | null = null;
  for (const account of accountResults) {
    if (account?.external_id) { userId = account.external_id; break; }
  }

  // Fall back to session cookie if external_id wasn't returned by PfM
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

  // Upsert each account as its own connection row.
  // For Facebook, this means each Page becomes a separate row with its own pfm_account_id.
  // UNIQUE (user_id, platform, pfm_account_id) handles deduplication on reconnect.
  let successCount = 0;
  for (let i = 0; i < allAccountIds.length; i++) {
    const pfmAccountId  = allAccountIds[i];
    const account       = accountResults[i];
    const accountName   = account?.name ?? account?.username ?? account?.handle ?? null;
    const accountAvatar = account?.avatar_url ?? account?.profile_image ?? null;
    const platform      = account?.platform ?? provider;

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
      console.error('[social/callback] DB upsert error for', pfmAccountId, dbError);
    } else {
      successCount++;
    }
  }

  if (successCount === 0) {
    return NextResponse.redirect(`${APP_URL}/scheduler?error=Failed+to+save+connection.`);
  }

  return NextResponse.redirect(`${APP_URL}/scheduler?connected=${encodeURIComponent(provider || 'unknown')}`);
}
