import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const PROCESSOR_URL = process.env.PROCESSOR_URL || '';
const PROCESSOR_SECRET = process.env.PROCESSOR_SECRET || 'helpedit-secret-change-me';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Get direct audio URL via Railway processor (uses yt-dlp android client)
async function resolveAudioUrl(videoUrl: string): Promise<string> {
  if (!PROCESSOR_URL) {
    throw new Error('PROCESSOR_URL not configured');
  }

  const isYouTube = !!extractYouTubeId(videoUrl);

  // For direct media URLs, return as-is
  if (!isYouTube && videoUrl.match(/\.(mp4|mp3|m4a|wav|ogg|webm|flac)(\?|$)/i)) {
    return videoUrl;
  }

  // Send to Railway processor to extract audio
  console.log(`[Railway] Extracting audio for: ${videoUrl.substring(0, 60)}`);
  const res = await fetch(`${PROCESSOR_URL}/api/extract-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-processor-secret': PROCESSOR_SECRET,
    },
    body: JSON.stringify({ videoUrl }),
    signal: AbortSignal.timeout(180000), // 3 min timeout
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Audio extraction failed: ${err}`);
  }

  const data = await res.json();
  if (!data.audioUrl) throw new Error('No audio URL returned from processor');

  console.log(`[Railway] Got audio URL: ${data.audioUrl.substring(0, 60)}`);
  return data.audioUrl;
}

// Transcribe with AssemblyAI
async function transcribeAudio(audioUrl: string) {
  const submitRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { Authorization: ASSEMBLYAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: audioUrl, auto_highlights: true }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`AssemblyAI submit failed: ${err}`);
  }

  const { id: transcriptId } = await submitRes.json();

  // Poll until complete (max 10 min)
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { Authorization: ASSEMBLYAI_KEY },
    });
    const pollData = await pollRes.json();
    if (pollData.status === 'completed') {
      return { id: transcriptId, text: pollData.text, words: pollData.words || [], duration: pollData.audio_duration };
    }
    if (pollData.status === 'error') {
      throw new Error(`Transcription failed: ${pollData.error}`);
    }
  }
  throw new Error('Transcription timed out');
}

// Claude hook detection
async function detectHooks(transcript: string, words: any[]) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a viral content expert. Analyze this transcript and find the best 5-15 clip segments for TikTok, Instagram Reels, and YouTube Shorts.

For each clip provide a JSON object with:
- title: catchy clip title (max 60 chars)
- hook_text: the attention-grabbing opening line
- start_time: start time in seconds (integer)
- end_time: end time in seconds (integer)
- virality_score: 1-100
- suggested_caption: social media caption
- hashtags: relevant hashtags
- platform: best platform (tiktok, youtube_shorts, instagram_reels)

Rules:
- Each clip 15-90 seconds long
- Strong hooks in first 3 seconds
- Complete thoughts, not cut mid-sentence
- Rank by virality potential

TRANSCRIPT:
${transcript}

WORD TIMESTAMPS (first 300):
${JSON.stringify(words.slice(0, 300))}

Respond with ONLY a JSON array. No markdown, no backticks, no explanation.`
      }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API failed: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || '[]';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}

// GET — video info for import page preview
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  // Try Railway processor for video info
  if (PROCESSOR_URL) {
    try {
      const res = await fetch(`${PROCESSOR_URL}/api/video-info?url=${encodeURIComponent(url)}`, {
        headers: { 'x-processor-secret': PROCESSOR_SECRET },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) return NextResponse.json(data);
      }
    } catch {}
  }

  return NextResponse.json({ title: 'Video', duration: 0, thumbnail: null });
}

// POST — full pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url || body.videoUrl;
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    if (!ASSEMBLYAI_KEY) return NextResponse.json({ error: 'ASSEMBLYAI_API_KEY not configured' }, { status: 500 });
    if (!ANTHROPIC_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    if (!PROCESSOR_URL) return NextResponse.json({ error: 'PROCESSOR_URL not configured' }, { status: 500 });

    console.log(`[Process] Starting: ${url}`);

    // Step 0: Extract audio via Railway
    const audioUrl = await resolveAudioUrl(url);

    // Step 1+2: Transcribe
    const transcript = await transcribeAudio(audioUrl);
    console.log(`[Process] Transcribed: ${transcript.words.length} words`);

    // Step 3: Detect hooks
    const hooks = await detectHooks(transcript.text, transcript.words);
    console.log(`[Process] Detected ${hooks.length} clips`);

    return NextResponse.json({
      success: true,
      transcript_id: transcript.id,
      video_duration: transcript.duration,
      clips: hooks.sort((a: any, b: any) => (b.virality_score || 0) - (a.virality_score || 0)),
      total: hooks.length,
      source_url: url,
    });

  } catch (err: any) {
    console.error('[Process] Error:', err.message);
    return NextResponse.json({ error: err.message || 'Processing failed' }, { status: 500 });
  }
}
