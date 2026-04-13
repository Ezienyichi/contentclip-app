import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const { url, projectId } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    const res = await fetch('https://api.assemblyai.com/v2/transcript', { method: 'POST', headers: { 'Authorization': process.env.ASSEMBLYAI_API_KEY||'', 'Content-Type': 'application/json' }, body: JSON.stringify({ audio_url: url, auto_highlights: true }) });
    const data = await res.json();
    return NextResponse.json({ success: true, transcriptId: data.id, projectId, status: 'transcribing' });
  } catch { return NextResponse.json({ error: 'Processing failed' }, { status: 500 }); }
}
