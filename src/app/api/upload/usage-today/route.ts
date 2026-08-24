import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PLAN_LIMITS: Record<string, { maxBytes: number; dailyCap: number }> = {
  pro:          { maxBytes: 100 * 1024 * 1024, dailyCap: 10 },
  professional: { maxBytes: 100 * 1024 * 1024, dailyCap: 10 },
  agency:       { maxBytes: 200 * 1024 * 1024, dailyCap: 25 },
};

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

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan ?? 'free').toLowerCase();
  const limits = PLAN_LIMITS[plan] ?? null;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: uploads } = await admin
    .from('clips')
    .select('file_size_bytes')
    .eq('user_id', user.id)
    .eq('source', 'upload')
    .gte('created_at', todayStart.toISOString());

  const count       = uploads?.length ?? 0;
  const bytesUsed   = uploads?.reduce((s, c) => s + (c.file_size_bytes ?? 0), 0) ?? 0;

  return NextResponse.json({
    count,
    bytes_used: bytesUsed,
    plan,
    limits: limits
      ? { max_bytes: limits.maxBytes, daily_cap: limits.dailyCap }
      : null,
  });
}
