import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';
const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter'] as const;
type Platform = typeof VALID_PLATFORMS[number];

export async function POST(req: NextRequest) {
  // ── Verify session server-side ──
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // ── Validate request body ──
  let platform: Platform;
  try {
    const body = await req.json();
    platform = body.platform;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
  }

  // ── Call Post for Me to generate the OAuth auth URL ──
  // external_id ties this OAuth session to our user — returned in PfM's account record
  const pfmRes = await fetch(`${PFM_API}/social-accounts/auth-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.POST_FOR_ME_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform,
      external_id: user.id,
    }),
  });

  if (!pfmRes.ok) {
    const detail = await pfmRes.text().catch(() => '');
    console.error('[social/connect] PfM error', pfmRes.status, detail);
    return NextResponse.json({ error: 'Failed to generate connection URL.' }, { status: 502 });
  }

  const pfmData = await pfmRes.json();
  const authUrl: string | undefined = pfmData.url;

  if (!authUrl) {
    console.error('[social/connect] PfM response missing url field', pfmData);
    return NextResponse.json({ error: 'No auth URL returned from Post for Me.' }, { status: 502 });
  }

  return NextResponse.json({ authUrl });
}
