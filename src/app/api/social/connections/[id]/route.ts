import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Service role for the UPDATE — but also locked by the user_id WHERE clause
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Verify identity server-side ──
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
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id: connectionId } = await params;

  // ── Soft-delete: mark disconnected, double-locked by user_id ──
  // Even with service role, the WHERE user_id = user.id ensures no cross-user deletions
  const { error, count } = await supabaseAdmin
    .from('social_connections')
    .update({ status: 'disconnected' })
    .eq('id', connectionId)
    .eq('user_id', user.id)   // ownership check — cannot disconnect another user's connection
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('[social/connections/[id]] DB error', error);
    return NextResponse.json({ error: 'Failed to disconnect.' }, { status: 500 });
  }

  if (count === 0) {
    // Connection not found or belongs to a different user — return 404, don't reveal which
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
