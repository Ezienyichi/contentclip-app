import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PFM_ACCOUNTS_API = 'https://api.postforme.dev/v1';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const isSuccess = searchParams.get('isSuccess');
  const provider   = searchParams.get('provider') ?? '';
  const errorMsg   = searchParams.get('error');

  if (isSuccess !== 'true') {
    const reason = encodeURIComponent(errorMsg ?? 'Connection cancelled or failed.');
    return NextResponse.redirect(`${APP_URL}/scheduler?error=${reason}`);
  }

  // Identify the user from their session cookie.
  // The session is available because the user initiated the OAuth flow from our app.
  let userId: string | null = null;
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
    // session unavailable in this redirect context
  }

  if (!userId) {
    console.error('[social/callback] Could not identify user — no session');
    return NextResponse.redirect(`${APP_URL}/scheduler?error=Could+not+identify+user.+Please+log+in+and+try+again.`);
  }

  const pfmApiKey = process.env.POST_FOR_ME_API_KEY!;

  // The accountIds query param from PfM's callback contains spc_ (connection) IDs, NOT sa_ IDs.
  // We must list social accounts filtered by our external_id (the userId we set at connect time)
  // to get the actual sa_ IDs that social_accounts requires when creating posts.
  const listUrl = new URL(`${PFM_ACCOUNTS_API}/social-accounts`);
  listUrl.searchParams.set('external_id', userId);
  listUrl.searchParams.set('status', 'connected');
  if (provider) listUrl.searchParams.set('platform', provider);
  listUrl.searchParams.set('limit', '25');

  let pfmAccounts: Array<Record<string, unknown>> = [];
  try {
    const listRes = await fetch(listUrl.toString(), {
      headers: { 'Authorization': `Bearer ${pfmApiKey}` },
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      pfmAccounts = listData?.data ?? [];
      console.log('[social/callback] fetched sa_ accounts', {
        userId,
        provider,
        count: pfmAccounts.length,
        ids: pfmAccounts.map((a: any) => a.id),
      });
    } else {
      const errText = await listRes.text();
      console.error('[social/callback] PfM list accounts failed', listRes.status, errText);
    }
  } catch (err) {
    console.error('[social/callback] error listing PfM accounts', err);
  }

  if (pfmAccounts.length === 0) {
    console.error('[social/callback] no connected sa_ accounts found for user', userId);
    return NextResponse.redirect(
      `${APP_URL}/scheduler?error=No+social+accounts+found+after+connecting.+Please+try+again.`
    );
  }

  // Upsert each sa_ account row.
  // UNIQUE (user_id, platform, pfm_account_id) handles deduplication on reconnect.
  let successCount = 0;
  for (const account of pfmAccounts) {
    const pfmAccountId  = account.id as string;           // sa_XXXX — PfM's internal account ID
    const accountName   = (account.username ?? null) as string | null;
    const accountAvatar = (account.profile_photo_url ?? null) as string | null;
    const platform      = (account.platform ?? provider) as string;

    console.log('[social/callback] upserting', { pfmAccountId, platform, accountName });

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
