import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': 'Bearer '+(process.env.RESEND_API_KEY||''), 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'HookClip <notifications@HookClip.app>', to, subject, html }) });
    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch { return NextResponse.json({ error: 'Email failed' }, { status: 500 }); }
}
