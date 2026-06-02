import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
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
        { error: 'Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { error } = await supabase
      .from('clips')
      .insert({
        user_id: user.id,
        video_url: body.video_url || '',
        title: body.title || 'Untitled Clip',
        start_time: body.start_time || 0,
        end_time: body.end_time || 60,
        duration: body.duration ||
          ((body.end_time || 60) - (body.start_time || 0)),
        virality_score: body.ai_score || 80,
        reasoning: body.reason || '',
        suggested_caption: body.caption || '',
        hashtags: body.hashtags || [],
        hook_text: body.hook_text || '',
        status: 'saved',
      });

    if (error) {
      console.error('Save clip error:', error);
      return NextResponse.json(
        { error: 'Failed to save clip.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Save clip error:', error);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
