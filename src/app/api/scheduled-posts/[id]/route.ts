import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)   // ownership double-lock
    .select('id');

  if (error) {
    console.error('[scheduled-posts DELETE] DB error', error);
    return NextResponse.json({ error: 'Failed to cancel post.' }, { status: 500 });
  }

  if (!data || data.length === 0)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  return NextResponse.json({ success: true });
}
