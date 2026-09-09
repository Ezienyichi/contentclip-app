import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Require an authenticated session — prevents open relay abuse.
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
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let subject: string, html: string;
  try {
    const body = await request.json();
    subject = String(body.subject ?? '').slice(0, 200);
    html    = String(body.html    ?? '').slice(0, 50_000);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!subject || !html) {
    return NextResponse.json({ error: 'subject and html are required.' }, { status: 400 });
  }

  // Always send to the authenticated user's own verified email — never to a caller-supplied address.
  const to = user.email;
  if (!to) {
    return NextResponse.json({ error: 'Account has no email address.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VangelClip <notifications@vangelclip.app>',
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[send-email] Resend error', res.status, data);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[send-email] fetch error', err);
    return NextResponse.json({ error: 'Email failed.' }, { status: 500 });
  }
}
