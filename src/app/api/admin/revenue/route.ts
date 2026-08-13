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
  const { data: transactions, error } = await db
    .from('transactions')
    .select('id, user_id, amount, plan, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: transactions ?? [] });
}
