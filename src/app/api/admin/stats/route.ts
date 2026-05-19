import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const { isAdmin } = await checkAdminAuth();
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminSupabase();

  const [
    { count: totalUsers },
    { count: totalClips },
    { data: planBreakdown },
    { data: recentUsers },
    { data: recentClips },
    { data: recentTransactions },
    { data: revenueData },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('clip_jobs').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('plan').then(async (r) => {
      const counts: Record<string, number> = {};
      (r.data ?? []).forEach((p: { plan: string }) => { counts[p.plan] = (counts[p.plan] ?? 0) + 1; });
      return { data: counts };
    }),
    db.from('profiles').select('id, email, plan, credits, created_at').order('created_at', { ascending: false }).limit(10),
    db.from('clip_jobs').select('id, user_id, source_url, status, created_at').order('created_at', { ascending: false }).limit(10),
    db.from('transactions').select('id, user_id, amount, plan, status, created_at').order('created_at', { ascending: false }).limit(10),
    db.from('transactions').select('amount, status'),
  ]);

  const totalRevenue = (revenueData ?? [])
    .filter((t: { status: string; amount: number }) => t.status === 'completed')
    .reduce((sum: number, t: { amount: number }) => sum + (t.amount ?? 0), 0);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    totalClips: totalClips ?? 0,
    totalRevenue,
    planBreakdown: planBreakdown ?? {},
    recentUsers: recentUsers ?? [],
    recentClips: recentClips ?? [],
    recentTransactions: recentTransactions ?? [],
  });
}
