import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const N8N_WEBHOOK_URL = 'https://vangelclip-ai.app.n8n.cloud/webhook/vangelclip-process';

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

    // ── DEDUCT CREDITS BEFORE PROCESSING ──
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

    try {
      // ── CALL N8N WEBHOOK ──
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          userId: user.id,
          userEmail: user.email,
          numClips: Math.min(numClips, 10),
          timeStart,
          timeEnd,
          category,
          creditsNeeded,
          creditsRemaining: credits - creditsNeeded,
          plan,
        }),
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n error: ${n8nResponse.status}`);
      }

      const n8nData = await n8nResponse.json();

      // ── RETURN RESULTS ──
      return NextResponse.json({
        success: true,
        clips: n8nData.clips || [],
        credits_used: creditsNeeded,
        credits_remaining: credits - creditsNeeded,
      });

    } catch (processingError: any) {
      // ── REFUND CREDITS ON FAILURE ──
      await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', user.id);

      console.error('Processing error:', processingError);

      return NextResponse.json(
        {
          error: 'Processing failed. Your credits have been refunded. Please try again.',
          details: processingError?.message,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
