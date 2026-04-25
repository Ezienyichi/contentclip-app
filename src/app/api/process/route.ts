import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const PROCESSOR_URL = process.env.PROCESSOR_URL || '';
const PROCESSOR_SECRET = process.env.PROCESSOR_SECRET || 'helpedit-secret-change-me';

// Piped.video instances — cookie-free YouTube proxy
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.projectsegfau.lt',
  'https://piped-api.garudalinux.org',
];

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Get direct audio URL from YouTube via Piped.video (no cookies needed)
async function resolveYouTubeAudio(videoUrl: string): Promise<string> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return videoUrl; // not YouTube — return as-is

  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${videoId}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.audioStreams?.length) continue;

      // Pick highest bitrate audio stream
      const stream = data.audioStreams
        .filter((s: any) => s.url && s.mimeType)
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

      if (stream?.url) {
        console.log(`[Piped] Got audio stream from ${base}`);
        return stream.url;
      }
    } catch (e) {
      console.log(`[Piped] ${base} failed`);
    }
  }

  // If all Piped instances fail, try Railway processor
  if (PROCESSOR_URL) {
    try {
      const res = await fetch(`${PROCESSOR_URL}/api/video-info?url=${encodeURIComponent(videoUrl)}`, {
        headers: { 'x-processor-secret': PROCESSOR_SECRET },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        // Railway processor resolved it — now get the audio via processor
        const audioRes = await fetch(`${PROCESSOR_URL}/api/extract-audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-processor-secret': PROCESSOR_SECRET },
          body: JSON.stringify({ videoUrl }),
          signal: AbortSignal.timeout(120000),
        });
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          if (audioData.audioUrl) return audioData.audioUrl;
        }
      }
    } catch (e) {
      console.log('[Processor] Railway fallback failed');
    }
  }

  return videoUrl; // last resort — let AssemblyAI try directly
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

// GET — fetch video info (title, duration, thumbnail) for import page preview
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const videoId = extractYouTubeId(url);
  if (videoId) {
    for (const base of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${base}/streams/${videoId}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const data = await res.json();
        return NextResponse.json({ title: data.title, duration: data.duration, thumbnail: data.thumbnailUrl, uploader: data.uploader });
      } catch {}
    }
  }

  // Fallback via Railway processor
  if (PROCESSOR_URL) {
    try {
      const res = await fetch(`${PROCESSOR_URL}/api/video-info?url=${encodeURIComponent(url)}`, {
        headers: { 'x-processor-secret': PROCESSOR_SECRET },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return NextResponse.json(await res.json());
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

    console.log(`[Process] Starting: ${url}`);

    // Step 0: Resolve YouTube URL to direct audio
    const directUrl = await resolveYouTubeAudio(url);
    console.log(`[Process] Resolved: ${directUrl.substring(0, 80)}...`);

    // Step 1+2: Transcribe
    const transcript = await transcribeAudio(directUrl);
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


// rebuild-20260425170210
