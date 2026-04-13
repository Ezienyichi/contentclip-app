import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const { transcript, projectId } = await request.json();
    if (!transcript) return NextResponse.json({ error: 'Transcript required' }, { status: 400 });
    const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY||'', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: 'Find viral clips. Respond with JSON array: title, hook_text, start_time, end_time, virality_score, suggested_caption, hashtags.', messages: [{ role: 'user', content: transcript }] }) });
    const data = await res.json();
    let clips:any[] = []; try { clips = JSON.parse((data.content?.[0]?.text||'[]').replace(/```json|```/g,'').trim()); } catch {}
    return NextResponse.json({ success: true, clips, total: clips.length, projectId });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
