import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const PLAN_WINDOWS: Record<string, number> = {
  free:         300,
  starter:      900,
  pro:          2700,
  agency:       5400,
  solo:         900,
  professional: 2700,
};

export async function POST(req: NextRequest) {
  try {
    // ── AUTH CHECK ──
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    // ── GET USER PROFILE ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan || 'free';
    const credits = profile?.credits || 0;
    const maxWindow = PLAN_WINDOWS[plan] || 300;

    // ── PARSE REQUEST ──
    const body = await req.json();
    const {
      videoUrl,
      numClips = 5,
      timeStart = 0,
      timeEnd = maxWindow,
      category = 'gospel',
      prompt = 'Find the most engaging viral moments with high impact',
    } = body;

    // ── VALIDATE URL ──
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required.' },
        { status: 400 }
      );
    }

    try {
      const parsed = new URL(videoUrl);
      const allowedHosts = [
        'youtube.com', 'www.youtube.com',
        'youtu.be', 'www.youtu.be',
        'vimeo.com', 'www.vimeo.com',
        'tiktok.com', 'www.tiktok.com',
        'vm.tiktok.com',
      ];
      if (!allowedHosts.includes(parsed.hostname)) {
        return NextResponse.json(
          { error: 'Only YouTube, Vimeo, and TikTok URLs are supported.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid video URL.' },
        { status: 400 }
      );
    }

    // ── CALCULATE CREDITS ──
    const windowSeconds = Math.min(timeEnd - timeStart, maxWindow);
    const creditsNeeded = Math.ceil(windowSeconds / 60);

    // ── CHECK CREDITS ──
    if (credits < creditsNeeded) {
      return NextResponse.json(
        {
          error: `Not enough credits. You need ${creditsNeeded} but have ${credits} remaining.`,
          credits_remaining: credits,
          credits_required: creditsNeeded,
        },
        { status: 402 }
      );
    }

    // ── DEDUCT CREDITS ──
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: credits - creditsNeeded })
      .eq('id', user.id)
      .eq('credits', credits);

    if (deductError) {
      return NextResponse.json(
        { error: 'Failed to deduct credits. Please try again.' },
        { status: 409 }
      );
    }

    // ── SET UP SSE STREAM ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: object) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          send({
            status: 'queued',
            creditsUsed: creditsNeeded,
            creditsRemaining: credits - creditsNeeded,
          });

          send({ status: 'preprocessing' });

          // ── CALL REKA API ──
          const rekaResponse = await fetch(
            'https://vision-agent.api.reka.ai/api/v1/clip',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': process.env.REKA_API_KEY!,
              },
              body: JSON.stringify({
                url: videoUrl,
                num_clips: Math.min(numClips, 10),
                start_time: timeStart,
                end_time: timeEnd,
                prompt,
                category,
              }),
            }
          );

          if (!rekaResponse.ok) {
            const rekaError = await rekaResponse.text();
            console.error('Reka API error:', rekaError);

            await supabase
              .from('profiles')
              .update({ credits })
              .eq('id', user.id);

            send({
              status: 'failed',
              error_message:
                'Video processing failed. Your credits have been refunded. Please try again.',
            });
            controller.close();
            return;
          }

          const rekaData = await rekaResponse.json();

          // ── FORMAT CLIPS ──
          const clips = (rekaData.clips || []).map(
            (clip: any, index: number) => ({
              id: `clip_${Date.now()}_${index}`,
              start_time: clip.start_time || 0,
              end_time: clip.end_time || 60,
              duration: (clip.end_time || 60) - (clip.start_time || 0),
              title: clip.title || clip.caption || `Clip ${index + 1}`,
              caption: clip.caption || clip.title || '',
              hashtags: clip.hashtags || [],
              ai_score: clip.virality_score || clip.score || clip.ai_score || 80,
              video_url: clip.video_url || '',
              thumbnail_url: clip.thumbnail_url || '',
              transcript: clip.transcript || '',
            })
          );

          // ── SAVE TO DATABASE ──
          await supabase.from('clip_jobs').insert({
            user_id: user.id,
            video_url: videoUrl,
            status: 'completed',
            clips,
            credits_used: creditsNeeded,
            created_at: new Date().toISOString(),
          });

          send({
            status: 'completed',
            clips,
            credits_used: creditsNeeded,
            credits_remaining: credits - creditsNeeded,
          });

        } catch (error: any) {
          console.error('Processing error:', error);

          await supabase
            .from('profiles')
            .update({ credits })
            .eq('id', user.id);

          send({
            status: 'failed',
            error_message:
              'Processing failed. Your credits have been refunded. Please try again.',
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
