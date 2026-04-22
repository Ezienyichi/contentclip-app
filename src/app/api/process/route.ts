import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// /api/process — COMPLETE VIDEO CLIPPING PIPELINE
// Step 0: Convert YouTube/TikTok URL to direct media URL
// Step 1: Submit to AssemblyAI for transcription
// Step 2: Poll until transcription completes
// Step 3: Send transcript to Claude for hook/viral detection
// ═══════════════════════════════════════════════════════════════

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

// Step 0: Convert YouTube/social URL to direct media URL
async function getDirectUrl(url: string): Promise<string> {
  // If already a direct media URL, return as-is
  if (url.match(/\.(mp4|mp3|m4a|wav|ogg|webm|flac)(\?|$)/i)) {
    return url;
  }

  // Use cobalt.tools API to extract direct audio URL
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        aFormat: 'mp3',
        isAudioOnly: true,
        filenamePattern: 'basic',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
      if (data.audio) return data.audio;
    }
  } catch (e) {
    console.log('cobalt.tools failed, trying alternative...');
  }

  // Fallback: return original URL and let AssemblyAI try
  return url;
}

// Step 1+2: Transcribe with AssemblyAI (submit + poll)
async function transcribeVideo(audioUrl: string) {
  const submitRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { Authorization: ASSEMBLYAI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      auto_highlights: true,
      speech_models: ["universal-3-pro", "universal-2"],
    }),
  });
  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`AssemblyAI submit failed: ${err}`);
  }
  const submitData = await submitRes.json();
  const transcriptId = submitData.id;

  // Poll until complete (max 10 minutes)
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

// Step 3: Claude hook detection
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API failed: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '[]';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}

// ═══ MAIN HANDLER ═══
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    if (!ASSEMBLYAI_KEY) return NextResponse.json({ error: 'AssemblyAI API key not configured. Add ASSEMBLYAI_API_KEY to .env.local' }, { status: 500 });
    if (!ANTHROPIC_KEY) return NextResponse.json({ error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local' }, { status: 500 });

    // Step 0: Convert to direct URL
    const directUrl = await getDirectUrl(url);

    // Step 1+2: Transcribe
    const transcript = await transcribeVideo(directUrl);

    // Step 3: Detect hooks
    const hooks = await detectHooks(transcript.text, transcript.words);

    if (hooks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No viral clips detected',
        transcript: transcript.text.substring(0, 500),
        clips: [],
        total: 0,
      });
    }

    return NextResponse.json({
      success: true,
      transcript_id: transcript.id,
      video_duration: transcript.duration,
      clips: hooks.sort((a: any, b: any) => (b.virality_score || 0) - (a.virality_score || 0)),
      total: hooks.length,
      source_url: url,
    });

  } catch (err: any) {
    console.error('Pipeline error:', err);
    return NextResponse.json({ error: err.message || 'Processing failed' }, { status: 500 });
  }
}
