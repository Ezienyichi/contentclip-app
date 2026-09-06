import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
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

  const { data, error } = await supabase
    .from('social_connections')
    .select('id, platform, account_name, account_avatar, connected_at, status, pfm_account_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('connected_at', { ascending: false });

  if (error) {
    console.error('[social/connections] DB error', error);
    return NextResponse.json({ error: 'Failed to load connections.' }, { status: 500 });
  }

  return NextResponse.json({ connections: data ?? [] });
}
