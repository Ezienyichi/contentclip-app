import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

    // On completion, deduct actual minutes used (idempotent via minutes_charged)
    if (serverResponse.ok && data.status === 'completed') {
      const admin = getAdmin();

      const { data: job } = await admin
        .from('clip_jobs')
        .select('id, minutes_charged')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single();

      // Only deduct once — skip if already charged
      if (job && job.minutes_charged == null) {
        // cost_usage is WayinVideo API credits (~1.9 per input minute), not minutes.
        // Divide by 2 to approximate actual video minutes consumed.
        const minutesUsed = Math.round((data.cost_usage ?? 0) / 2);

        if (minutesUsed > 0) {
          const { data: currentProfile } = await admin
            .from('profiles')
            .select('minutes_used')
            .eq('id', user.id)
            .single();
          await admin
            .from('profiles')
            .update({ minutes_used: (currentProfile?.minutes_used ?? 0) + minutesUsed })
            .eq('id', user.id);
        }

        await admin
          .from('clip_jobs')
          .update({ minutes_charged: minutesUsed, status: 'completed' })
          .eq('id', job.id);
      }
    }

    return NextResponse.json(data, { status: serverResponse.status });

  } catch (error: any) {
    console.error('clip-status error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
