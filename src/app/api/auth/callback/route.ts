import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    const cs = await cookies();
    const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cs.getAll(); }, setAll(c) { try { c.forEach(({name,value,options})=>cs.set(name,value,options)); } catch {} } } });
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(origin+'/dashboard');
  }
  return NextResponse.redirect(origin+'/auth?error=auth_failed');
}
