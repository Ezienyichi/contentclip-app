import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ task_id: string }> }
) {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { task_id } = await params;
    const serverResponse = await fetch(`${BACKEND_API_URL}/api/clip-status/${task_id}`);
    const data = await serverResponse.json();
    return NextResponse.json(data, { status: serverResponse.status });

  } catch (error: any) {
    console.error('clip-status error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
