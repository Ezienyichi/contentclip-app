import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let clip_id: string, platform: string, current_caption: string;
  try {
    const body = await req.json();
    clip_id         = String(body.clip_id         ?? '');
    platform        = String(body.platform        ?? 'tiktok');
    current_caption = String(body.current_caption ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!clip_id) return NextResponse.json({ error: 'clip_id is required.' }, { status: 400 });

  const { data: clip } = await supabase
    .from('clips')
    .select('title, hook_text, suggested_caption, hashtags')
    .eq('id', clip_id)
    .eq('user_id', user.id)
    .single();

  if (!clip) return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  const platformLabels: Record<string, string> = {
    tiktok:    'TikTok',
    instagram: 'Instagram Reels',
    youtube:   'YouTube Shorts',
    facebook:  'Facebook Reels',
    twitter:   'X (Twitter)',
    pinterest: 'Pinterest',
  };

  const platformLabel = platformLabels[platform] ?? platform;

  const systemPrompt = `You are a social media copywriter who writes high-performing captions for short-form videos. Write engaging, platform-native captions with strong hooks. Keep captions concise and punchy. Respond with JSON only: { "caption": "...", "hashtags": "..." }`;

  const userPrompt = `Write a new caption for a ${platformLabel} post.

Clip title: ${clip.title}
Hook: ${clip.hook_text ?? ''}
Original suggested caption: ${clip.suggested_caption ?? ''}
${current_caption ? `Current caption (improve or replace): ${current_caption}` : ''}

Write a caption that:
- Starts with a strong hook
- Is native to ${platformLabel} style and tone
- Includes a call to action
- Is under 150 words

Also write 5-8 relevant hashtags as a space-separated string.

Respond with JSON only: { "caption": "...", "hashtags": "..." }`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_CAPTION_MODEL ?? 'gemini-3.5-flash-lite'}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 512, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    console.error('[caption] Gemini error', res.status, await res.text().catch(() => ''));
    return NextResponse.json({ error: 'AI caption generation failed.' }, { status: 502 });
  }

  const data = await res.json();
  let caption = '', hashtags = '';
  try {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    caption  = String(json.caption  ?? '');
    hashtags = String(json.hashtags ?? '');
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 502 });
  }

  return NextResponse.json({ caption, hashtags });
}
