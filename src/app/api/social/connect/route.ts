import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';
const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter'] as const;
type Platform = typeof VALID_PLATFORMS[number];

export async function POST(req: NextRequest) {
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

  const apiKey = process.env.POST_FOR_ME_API_KEY;
  if (!apiKey) {
    console.error('[social/connect] POST_FOR_ME_API_KEY is not set');
    return NextResponse.json({ error: 'Server misconfiguration: API key missing.' }, { status: 500 });
  }

  const payload = { platform, external_id: user.id };
  const endpoint = `${PFM_API}/social-accounts/auth-url`;

  console.log('[social/connect] Calling PfM', { endpoint, payload });

  const pfmRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await pfmRes.text().catch(() => '(unreadable)');

  console.log('[social/connect] PfM response', {
    status: pfmRes.status,
    contentType: pfmRes.headers.get('content-type'),
    body: responseText,
  });

  if (!pfmRes.ok) {
    return NextResponse.json(
      { error: `Post for Me error ${pfmRes.status}: ${responseText}` },
      { status: 502 }
    );
  }

  let pfmData: Record<string, unknown>;
  try {
    pfmData = JSON.parse(responseText);
  } catch {
    console.error('[social/connect] PfM returned non-JSON on 2xx', responseText);
    return NextResponse.json({ error: 'Unexpected response from Post for Me.' }, { status: 502 });
  }

  const authUrl = pfmData.url as string | undefined;

  if (!authUrl) {
    console.error('[social/connect] PfM response has no url field', pfmData);
    return NextResponse.json(
      { error: `Post for Me returned no URL. Keys present: ${Object.keys(pfmData).join(', ')}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ authUrl });
}
